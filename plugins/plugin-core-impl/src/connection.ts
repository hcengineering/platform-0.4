//
// Copyright © 2020 Anticrm Platform Contributors.
//
// Licensed under the Eclipse Public License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License. You may
// obtain a copy of the License at https://www.eclipse.org/legal/epl-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//
// See the License for the specific language governing permissions and
// limitations under the License.
//

import {
  Class,
  Doc,
  DocumentQuery,
  generateId,
  Ref,
  Storage,
  Tx
} from '@anticrm/core'
import { getMetadata } from '@anticrm/platform'
import pluginCore from '@anticrm/plugin-core'

class DeferredPromise<T> {
  _promise: Promise<T>
  public resolve!: (value: T | PromiseLike<T>) => void
  public reject!: (reason: any) => void
  constructor () {
    this._promise = new Promise(
      (
        resolve: (value: T | PromiseLike<T>) => void,
        reject: (reason?: any) => void
      ) => {
        this.resolve = resolve
        this.reject = reject
      }
    )
  }
}
interface Operation {
  _id: number
  request: () => void // Perform request again
  promise: DeferredPromise<any>
}

export async function connectBrowser (
  handler: (tx: Tx) => void
): Promise<Storage> {
  // Client
  const clientUrl = getMetadata(pluginCore.metadata.ClientUrl) ?? 'localhost:18018'
  const clientId = generateId() // <-- Uniq ID to identify client in case of re-connections.

  let socket: Promise<WebSocket>
  let reqId: number = 0

  const requests = new Map<number, Operation>()

  async function request (op: string, ...params: any[]): Promise<any> {
    const _id = ++reqId

    const _op: Operation = {
      _id,
      request: async () => {
        const s = await doConnect()
        s.send(
          JSON.stringify({
            _id,
            action: op,
            params: params
          })
        )
      },
      promise: new DeferredPromise<any>()
    }
    requests.set(_id, _op)

    // Send request
    _op.request()

    // Waiting to be complete.
    const response = await _op.promise._promise
    const err = response.error as string
    if (err !== undefined) {
      throw new Error(`Failed to process request ${err}`)
    }
    return response.result
  }

  async function doConnect (): Promise<WebSocket> {
    try {
      if (socket !== undefined && (await socket).readyState === WebSocket.OPEN) {
        // We have working socket.
        return await socket
      }
    } catch (err) {
      // skip rejected
    }
    socket = new Promise<WebSocket>(resolve => {
      const ws = new WebSocket(`ws://${clientUrl}/${clientId}`)
      ws.onopen = () => {
        resolve(ws)

        // We need to reply requests in case they are missed.
        for (const op of requests.entries()) {
          op[1].request()
        }
      }
      ws.onerror = () => {
        // Force reconnect in 1 second.
        setTimeout(() => {
          // Try reconnect
          doConnect() // eslint-disable-line
        }, 1000)
      }
      ws.onmessage = evt => {
        const data = evt.data
        const msg = JSON.parse(data)
        if (msg._id !== undefined) {
          const req = requests.get(msg._id)
          if (req !== undefined) {
            req.promise.resolve(msg)
          }
        } else {
          // From server transaction
          handler((msg.tx as unknown) as Tx)
        }
      }
    })
    return socket
  }

  // Force socket creation.
  doConnect() // eslint-disable-line

  async function findAll<T extends Doc> (
    _class: Ref<Class<T>>,
    query: DocumentQuery<T>
  ): Promise<T[]> {
    const result = await request('findAll', _class, query)
    return result as T[]
  }
  async function tx (tx: Tx): Promise<void> {
    await request('tx', tx)
    // Process on server and return result.
    handler(tx)
  }

  return {
    findAll,
    tx
  }
}
