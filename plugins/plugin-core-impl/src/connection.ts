//
// Copyright © 2021 Anticrm Platform Contributors.
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
import { Account, Class, Doc, DocumentQuery, FileOp, FindResult, Ref, Storage, Tx, CoreClient } from '@anticrm/core'
import type { Request, Response } from '@anticrm/rpc'
import { readResponse, RequestProcessor, serialize } from '@anticrm/rpc'
import { unknownStatus } from '@anticrm/status'

type TxHandler = (tx: Tx) => void

class WebSocketConnection extends RequestProcessor implements Storage, CoreClient {
  socket: WebSocket
  handler: TxHandler

  constructor (socket: WebSocket, handler: TxHandler) {
    super()
    this.socket = socket
    this.handler = handler
    socket.onerror = () => this.reject(unknownStatus('Unknown error'))
    socket.onclose = (reason) => this.reject(unknownStatus(`Connection close: ${reason.reason}`))
    socket.onmessage = (evt) => this.onmessage(evt)
  }

  private onmessage (evt: MessageEvent): void {
    this.process(readResponse(evt.data as string))
  }

  protected send (request: Request<any>): void {
    this.socket.send(serialize(request))
  }

  protected notify (response: Response<any>): void {
    if (response.result !== undefined) {
      this.handler(response.result as Tx)
    }
  }

  async findAll<T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>): Promise<FindResult<T>> {
    return (await this.request('findAll', _class, query)) as FindResult<T>
  }

  async accountId (): Promise<Ref<Account>> {
    return (await this.request('accountId')) as Ref<Account>
  }

  async tx (tx: Tx): Promise<void> {
    await this.request('tx', tx)
    // Process on server and return result.
    this.handler(tx)
  }

  async file (op: FileOp): Promise<string> {
    return await this.request('file', op)
  }
}

export interface Connection {
  storage: CoreClient
  close: () => void
}

export async function connect (clientUrl: string, handler: TxHandler): Promise<Connection> {
  const socket = new WebSocket(`ws://${clientUrl}`)
  // Wait for connection to be established.
  await new Promise((resolve, reject) => {
    socket.onopen = resolve

    socket.onerror = reject.bind(new Error(`Failed to connect to ${clientUrl}`))
    setTimeout(() => reject.bind(new Error(`Failed to connect to ${clientUrl}`)), 5000)
  })

  return { storage: new WebSocketConnection(socket, handler), close: socket.close.bind(socket) }
}
