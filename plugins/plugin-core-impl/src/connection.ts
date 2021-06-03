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
import { generateId, Storage, Tx } from '@anticrm/core'
import { readResponse, RequestProcessor, serialize } from '@anticrm/rpc'

export async function connect (
  clientUrl: string,
  handler: (tx: Tx) => void
): Promise<Storage> {
  // Client
  const clientId = generateId() // <-- Uniq ID to identify client in case of re-connections.

  let socket: Promise<WebSocket>

  function isClosed (socket: WebSocket): boolean {
    return socket.readyState === WebSocket.CLOSED || socket.readyState === WebSocket.CLOSING
  }

  async function doConnect (): Promise<WebSocket> {
    try {
      if (socket === undefined || isClosed(await socket)) {
        socket = new Promise<WebSocket>(resolve => {
          const ws = new WebSocket(`ws://${clientUrl}/${clientId}`)
          ws.onopen = () => {
            resolve(ws)

            // We need to reply requests in case they are missed.
            processor.onOpen()
          }
          ws.onerror = () => {
            // Force reconnect in 1 second.
            setTimeout(() => { doConnect() }, 1000) // eslint-disable-line
          }
          ws.onmessage = evt => { processor.process(readResponse(evt.data as string)) }
        })
      }
    } catch (err) {
    // skip rejected
    }
    return socket
  }
  const processor = new RequestProcessor(async () => {
    const s = await doConnect()
    return {
      send: (request) => {
        s.send(serialize(request))
      }
    }
  }, handler)

  // Force socket creation.
  doConnect() // eslint-disable-line

  return processor
}
