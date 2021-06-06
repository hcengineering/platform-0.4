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

import { unknownError } from '@anticrm/status'
import { Incoming } from '@anticrm/webrtc'
import { serialize } from '@anticrm/rpc'
import WebSocket, { Server } from 'ws'

import MeetingService from './meeting.service'

export interface ServerProtocol {
  shutdown: () => void
}

export async function start (
  host: string,
  port: number
): Promise<ServerProtocol> {
  console.log(`Starting server on ${host}:${port}...`)

  const meetingService = new MeetingService()
  const wss = new Server({ host, port })

  const connections = new Map<number, WebSocket>()

  let lastClientID = 0

  wss.on('connection', (ws: WebSocket) => {
    const clientID = lastClientID++

    console.log('New client connected:', clientID)

    connections.set(clientID, ws)

    const { onWSMsg, onClose } = meetingService.onNewClient((msg: any) =>
      ws.send(JSON.stringify(msg))
    )

    ws.onclose = () => {
      onClose() // eslint-disable-line @typescript-eslint/no-floating-promises
    }

    ws.onerror = error => {
      console.error('communication error:', error)
    }

    ws.onmessage = (evt): void => {
      let msg: Incoming
      const value = evt.data.valueOf()

      try {
        msg = typeof value === 'string'
          ? JSON.parse(value)
          : value
      } catch (e) {
        console.error('Failed to parse incoming msg:', value)
        return
      }

      onWSMsg(msg)
        .then(result => {
          if (msg.id !== undefined) {
            ws.send(serialize({
              id: msg.id,
              result
            }))
          }
        })
        .catch((e) =>
          ws.send(serialize({
            id: msg.id,
            error: unknownError(e)
          }))
        )
    }
  })

  return new Promise(resolve => {
    const serverProtocol: ServerProtocol = {
      shutdown: async () => {
        console.log('Shutting down meeting service...')

        await meetingService.close()

        for (const conn of connections.entries()) {
          conn[1].close()
        }
        console.log('Stopping server itself')

        wss.close()
      }
    }
    resolve(serverProtocol)
  })
}
