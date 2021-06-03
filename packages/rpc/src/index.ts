//
// Copyright © 2020, 2021 Anticrm Platform Contributors.
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

import status, { Status, StatusCode, component, Component, PlatformError, Severity } from '@anticrm/status'
import { Class, Doc, DocumentQuery, Obj, Ref, Storage, Tx } from '@anticrm/core'

export type ReqId = string | number

export class Request<P extends any[]> {
  id?: ReqId
  method: string
  params: P

  constructor (method: string, ...params: P) {
    this.method = method
    this.params = params
  }
}

/**
 * Response object define a server response on transaction request.
 *
 * Also used to inform other clients about operations being performed by server.
 */
export interface Response<R> {
  result?: R
  id?: ReqId
  error?: Status
}

export function serialize (object: Request<any> | Response<any>): string {
  return JSON.stringify(object)
}

export function readResponse<D> (response: string): Response<D> {
  return JSON.parse(response)
}

export function readRequest<P extends any[]> (request: string): Request<P> {
  const result: Request<P> = JSON.parse(request)
  if (typeof result.method !== 'string') { throw new PlatformError(new Status(Severity.ERROR, Code.BadRequest, {})) }
  return result
}

export function fromStatus (status: Status, id?: ReqId): Response<any> {
  return { id, error: status }
}

export const Code = component('rpc' as Component, {
  Unauthorized: '' as StatusCode,
  Forbidden: '' as StatusCode,
  BadRequest: '' as StatusCode,
  UnknownMethod: '' as StatusCode<{method: string}>
})

export interface RequestStream {
  send: <T extends any[]>(req: Request<T>) => void
}

interface Operation {
  id: number
  request: () => void // Perform request again
  promise: Promise<any>
  resolve: <T> (value: T) => void
}

/**
 * Process RPC request and handle responses
 */
export class RequestProcessor implements Storage {
  reqId: number = 0
  requests = new Map<ReqId, Operation>()
  stream: () => Promise<RequestStream>
  handler: (tx: Tx) => void

  constructor (stream: () => Promise<RequestStream>, handler: (tx: Tx) => void) {
    this.stream = stream
    this.handler = handler
  }

  public process<T>(response: Response<T>): void {
    if (response.id !== undefined) {
      const req = this.requests.get(response.id)
      if (req !== undefined) {
        req.resolve(response)
      }
    } else {
      // From server transaction
      this.handler((response.result as unknown) as Tx)
    }
  }

  public onOpen (): void {
    // We need to reply requests in case they are missed.
    for (const op of this.requests.entries()) {
      op[1].request()
    }
  }

  public async request (method: string, ...params: any[]): Promise<any> {
    const id = ++this.reqId
    let resolve: <T> (value: T) => void = () => {}

    const p = new Promise((r) => { resolve = r }) // eslint-disable-line

    const op: Operation = {
      id,
      request: async () => {
        (await this.stream()).send({ method, id, params })
      },
      resolve,
      promise: p
    }
    this.requests.set(id, op)

    // Send request
    op.request()

    // Waiting to be complete.
    const response = await op.promise
    const err = response.error as string
    if (err !== undefined) {
      throw new Error(`Failed to process request ${err}`)
    }
    return response.result
  }

  async findAll<T extends Doc> (_class: Ref<Class<T>>, query: DocumentQuery<T>): Promise<T[]> {
    const result = await this.request('findAll', _class, query)
    return result as T[]
  }

  async tx (tx: Tx): Promise<void> {
    await this.request('tx', tx)
    // Process on server and return result.
    this.handler(tx)
  }

  isDerived<T extends Obj>(_class: Ref<Class<T>>, from: Ref<Class<T>>): boolean {
    throw new PlatformError(new Status(Severity.ERROR, status.status.UnknownError, { message: 'isDerived could not be passed with client protocol' }))
  }
}
