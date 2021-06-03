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

import { Storage, Tx } from '@anticrm/core'
import { readRequest, Response, Request, serialize } from '@anticrm/rpc'
import status, { Severity, Status } from '@anticrm/status'
import { createServer, IncomingMessage } from 'http'
import WebSocket, { AddressInfo, Server } from 'ws'

export interface ServerProtocol {
  shutdown: () => void
  address: () => { host: string, port: number }
}
export interface StorageProvider {
  connect: (clientId: string, tx: (tx: Tx) => void) => Storage
  close: (clientId: string) => void
}

export async function start (
  host: string | undefined,
  port: number,
  provider: StorageProvider
): Promise<ServerProtocol> {
  console.log(`starting server on port ${port}...`)
  console.log(`host: ${host ?? 'localhost'}`)

  const server = createServer()
  const wss = new Server({ noServer: true })

  const connections = new Map<string /* clientId */, WebSocket>()

  wss.on('connection', (ws: WebSocket, request: any, clientId: string) => {
    console.log('connect:', clientId)

    const storage = provider.connect(clientId, tx => {
      // Send transaction to client.
      const resp: Response<any> = {
        id: tx._id,
        result: tx
      }
      ws.send(serialize(resp))
    })

    async function handleRequest (request: Request<any>): Promise<void> {
      const { id, method, params } = request
      try {
        const result = await Reflect.apply(
          (storage as any)[method],
          storage,
          params
        )
        const resp: Response<any> = {
          id,
          result
        }
        ws.send(serialize(resp))
      } catch (error) {
        const resp: Response<any> = {
          id,
          error: new Status(Severity.ERROR, status.status.UnknownError, { message: error })
        }
        ws.send(
          serialize(resp)
        )
      }
    }

    connections.set(clientId, ws)

    ws.onclose = () => {
      connections.delete(clientId)
      provider.close(clientId)
    }
    ws.onerror = error => {
      console.log('communication error:', error)
    }
    ws.on('message', (msg: string): void => {
      const request = readRequest(msg)
      handleRequest(request) // eslint-disable-line
    })
  })

  server.on('upgrade', (request: IncomingMessage, socket, head: Buffer) => {
    const clientId = request.url?.substring(1) // remove leading '/'
    if (clientId === undefined || clientId.trim().length === 0) {
      socket.write('HTTP/1.1 400 Bad Request\r\n\r\n')
      socket.destroy()
      return
    }
    wss.handleUpgrade(request, socket, head, ws => {
      wss.emit('connection', ws, request, clientId)
    })
  })

  return new Promise(resolve => {
    const httpServer = server.listen(port, host, () => {
      const serverProtocol: ServerProtocol = {
        shutdown: async () => {
          console.log('Shutting down server:', httpServer.address())

          for (const conn of connections.entries()) {
            provider.close(conn[0])
            conn[1].close()
          }
          console.log('stop server itself')
          httpServer.close()
        },
        address: () => {
          const addr = httpServer.address()
          if (addr !== null && typeof addr !== 'string') {
            const ad = addr as AddressInfo
            return { host: ad.address, port: ad.port }
          }
          if (addr !== null && typeof addr === 'string') {
            const addrSegm = addr.split(':')
            if (addrSegm.length === 2) {
              const phost = addrSegm[0]
              const pport = parseInt(addrSegm[1])
              if (!isNaN(pport)) {
                return { host: phost, port: pport }
              }
            }
            console.error('Invalid address returned:', addr)
          }

          return { host: host ?? 'locahost', port: port }
        }
      }
      resolve(serverProtocol)
    })
  })
}
