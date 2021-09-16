import {
  Account,
  Class,
  Client,
  createClient as createCoreClient,
  Doc,
  DocumentQuery,
  FindResult,
  Ref,
  Tx,
  TxOperations,
  WithAccountId,
  withOperations
} from '@anticrm/core'
import { readResponse, Request, RequestProcessor, Response, serialize } from '@anticrm/rpc'
import { unknownStatus } from '@anticrm/status'
import WebSocket from 'ws'

export class TestConnection extends RequestProcessor implements WithAccountId {
  socket: WebSocket
  handler: (tx: Tx) => void

  constructor (socket: WebSocket, handler: (tx: Tx) => void) {
    super()
    this.socket = socket
    this.handler = handler
    socket.onerror = (reason) => this.reject(unknownStatus(`Unknown error: ${reason.message}`))
    socket.onclose = (reason) => this.reject(unknownStatus(`Connection close: ${reason.reason}`))
    socket.onmessage = (evt) => this.onmessage(evt)
  }

  private onmessage (evt: WebSocket.MessageEvent): void {
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

  async tx (tx: Tx): Promise<void> {
    await this.request('tx', tx)
    this.handler(tx)
  }

  async accountId (): Promise<Ref<Account>> {
    return await this.request('accountId')
  }
}

export type ClientWithShutdown = Client & TxOperations & { shutdown: () => void }

export async function createClient (clientUrl: string, notify?: (tx: Tx) => void): Promise<ClientWithShutdown> {
  const socket = new WebSocket(`ws://${clientUrl}`)
  const client: ClientWithShutdown = (await createCoreClient(async (tx) => {
    // Wait for connection to be established.
    await new Promise<any>((resolve, reject) => {
      socket.onopen = () => {
        resolve(null)
      }
      socket.onclose = (event) => {
        reject(new Error(`Failed to connect to ${clientUrl}: reason: ${event.reason}`))
      }
      socket.onerror = (reason) => {
        reject(new Error(`Failed to connect to ${clientUrl}: reason: ${reason.message}`))
      }
    })

    return new TestConnection(socket, tx)
  }, notify)) as unknown as ClientWithShutdown
  client.shutdown = () => {
    socket.terminate()
  }

  const accountId = await client.accountId()
  return withOperations(accountId, client)
}
