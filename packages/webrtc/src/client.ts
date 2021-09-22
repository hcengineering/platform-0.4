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

import { Request, RequestProcessor, serialize, readResponse } from '@anticrm/rpc'
import { RequestMsg, NotificationMethod, IncomingNotifications, OutgoingNotifications } from './api'

type Subscriber = (x: OutgoingNotifications) => Promise<void> | void

export class Client extends RequestProcessor {
  private readonly subs = new Map<NotificationMethod, Subscriber[]>()
  private ws: Promise<WebSocket>
  private isClosed = false

  constructor (url: string) {
    super()
    this.ws = this.initWS(url)
  }

  async close (): Promise<void> {
    this.isClosed = true
    await this.ws.then(ws => ws.close())
  }

  protected send (request: Request<any>): void {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.ws.then((ws) => {
      ws.send(serialize(request))
    })
  }

  protected notify (response: OutgoingNotifications): void {
    const notification = response.result?.notification

    if (notification === undefined) {
      return
    }

    (this.subs.get(notification) ?? [])
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      .forEach(s => s(response))
  }

  private async initWS (url: string): Promise<WebSocket> {
    return await new Promise((resolve) => {
      const ws = new WebSocket(url)
      const onClose = (): void => {
        if (this.isClosed) {
          return
        }

        this.ws = new Promise<WebSocket>(() => {})
        setTimeout(() => {
          this.ws = this.initWS(url)
        }, 1000)
      }
      ws.addEventListener('open', () => resolve(ws))
      ws.addEventListener('close', onClose)
      ws.addEventListener('error', (e) => {
        console.error('Communication error occured:', e)
      })
      ws.addEventListener('message', (event) => {
        this.process(readResponse(event.data))
      })
    })
  }

  public async sendRequest (req: RequestMsg): Promise<any> {
    return await this.request(req.method, ...req.params)
  }

  public sendNotification (notification: IncomingNotifications): void {
    this.send(notification)
  }

  public subscribe (method: NotificationMethod, sub: Subscriber): () => void {
    const subs = this.subs.get(method) ?? []
    subs.push(sub)

    this.subs.set(method, subs)

    return () =>
      this.subs.set(method, (this.subs.get(method) ?? []).filter(x => x !== sub))
  }
}
