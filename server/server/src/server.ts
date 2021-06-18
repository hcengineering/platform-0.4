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
import type { Request, Response } from '@anticrm/rpc'
import { Code, readRequest, serialize } from '@anticrm/rpc'
import { Severity, Status } from '@anticrm/status'
import { createServer, IncomingMessage } from 'http'
import WebSocket, { AddressInfo, Server } from 'ws'

export interface ServerProtocol {
  shutdown: () => void
  address: () => { host: string, port: number }
}

export type ShutdownOperation = (code?: number, data?: string) => void

export interface StorageProvider {
  connect: (clientId: string, token: string, sendTx: (tx: Tx) => void, close: ShutdownOperation) => Promise<Storage>
  close: (clientId: string) => Promise<void>
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

  wss.on('connection', (ws: WebSocket, request: any, token: string) => {
    const clientId = generateId()

    const sendTx = (tx: Tx): void => {
      // Send transaction to client.
      ws.send(serialize({ id: tx._id, result: tx }))
    }

    async function handleRequest (storage: Promise<Storage>, request: Request<any>): Promise<void> {
      const { id, method, params } = request
      try {
        const store = await storage
        const callOp = (store as any)[method]
        const result = await Reflect.apply(callOp, store, params)
        ws.send(serialize({ id, result }))
      } catch (error) {
        const params = { message: error.message, stack: error.stack }
        const resp: Response<any> = { id, error: new Status(Severity.ERROR, Code.BadRequest, params) }
        ws.send(serialize(resp))
      }
    }

    const storage = provider.connect(clientId, token, sendTx, (): void => {
      ws.close()
    })
    storage.catch((err) => {
      console.log(err)
      ws.close(404, err.message)
      connections.delete(clientId)
    })

    connections.set(clientId, ws)

    ws.on('message', (msg: string): void => {
      const request = readRequest(msg)
      handleRequest(storage, request) // eslint-disable-line
    })

    ws.onclose = () => {
      console.log('clientClose client', clientId)
      connections.delete(clientId)
      provider.close(clientId) // eslint-disable-line @typescript-eslint/no-floating-promises
    }
    ws.onerror = (error) => {
      console.error('communication error:', error)
      connections.delete(clientId)
      provider.close(clientId) // eslint-disable-line @typescript-eslint/no-floating-promises
    }
  })

  server.on('upgrade', (request: IncomingMessage, socket, head: Buffer) => {
    const token = request.url?.substring(1) // remove leading '/'
    if (token === undefined || token.trim().length === 0) {
      socket.write('HTTP/1.1 400 Bad Request\r\n\r\n')
      socket.destroy()
      return
    }

    // TODO: Validate token.

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request, token)
    })
  })

  return new Promise((resolve) => {
    const httpServer = server.listen(port, host, () => {
      const serverProtocol: ServerProtocol = {
        shutdown: async () => {
          console.log('Shutting down server:', httpServer.address())

          for (const conn of connections.entries()) {
            provider.close(conn[0]) // eslint-disable-line @typescript-eslint/no-floating-promises
            conn[1].close()
          }
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
