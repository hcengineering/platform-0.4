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

import { DeferredPromise } from '@anticrm/core'
import { component, Component, PlatformError, Severity, Status, StatusCode } from '@anticrm/status'

/**
 * @public
 */
export type ReqId = string | number

/**
 * @public
 */
export class Request<P extends any[], M extends string = string> {
  id?: ReqId
  method: M
  params: P

  constructor (method: M, ...params: P) {
    this.method = method
    this.params = params
  }
}

/**
 * Response object define a server response on transaction request.
 *
 * Also used to inform other clients about operations being performed by server.
 * @public
 */
export interface Response<R> {
  result?: R
  id?: ReqId
  error?: Status
}

/**
 * @public
 */
export function serialize (object: Request<any> | Response<any>): string {
  return JSON.stringify(object, replacer)
}
/**
 * @public
 */
export function readResponse<D> (response: string): Response<D> {
  return JSON.parse(response, reviver)
}

function replacer (key: string, value: any): any {
  if (value instanceof Map) {
    return {
      dataType: 'Map',
      value: Array.from(value.entries())
    }
  } else {
    return value
  }
}

function reviver (key: string, value: any): any {
  if (typeof value === 'object' && value !== null) {
    if (value.dataType === 'Map') {
      return new Map(value.value)
    }
  }
  return value
}

/**
 * @public
 */
export function readRequest<P extends any[]> (request: string): Request<P> {
  const result: Request<P> = JSON.parse(request)
  if (typeof result.method !== 'string') {
    throw new PlatformError(new Status(Severity.ERROR, Code.BadRequest, {}))
  }
  return result
}

/**
 * @public
 */
export function fromStatus (status: Status, id?: ReqId): Response<any> {
  return { id, error: status }
}

/**
 * @public
 */
export const Code = component('rpc' as Component, {
  Unauthorized: '' as StatusCode,
  Forbidden: '' as StatusCode,
  BadRequest: '' as StatusCode,
  UnknownMethod: '' as StatusCode<{ method: string }>
})

interface RequestHandle {
  promise: DeferredPromise<any>
  stack: any
}
/**
 * Process requests and handle responses.
 * Also allow to handle non identified results passed from other side.
 *
 * Hold operations in progress and allow to retry them if required.
 *
 * @public
 */
export abstract class RequestProcessor {
  private reqIndex: number = 0
  private readonly requests = new Map<ReqId, RequestHandle>()

  protected abstract send (request: Request<any>): void
  protected abstract notify (response: Response<any>): void

  protected process (response: Response<any>): void {
    if (response.id !== undefined) {
      const req = this.requests.get(response.id)
      if (req !== undefined) {
        if (response.error !== undefined) {
          console.error('RPC error', response.error, req.stack)
          req.promise.reject(new PlatformError(response.error))
          return
        } else {
          req.promise.resolve(response.result)
          return
        }
      }
    }
    this.notify(response)
  }

  /**
   * Reject all waited pending operations.
   *
   * This method is intended to be executed by protocol listening parts to
   * cancal any pending requests to control UI is not hang.
   *
   * @param reason - Why request was rejected.
   */
  protected reject (status: Status): void {
    // We need to reply requests in case they are missed.
    for (const op of this.requests.entries()) {
      op[1].promise.reject(new PlatformError(status))
    }
    this.requests.clear()
  }

  protected async request (method: string, ...params: any[]): Promise<any> {
    const id = ++this.reqIndex
    const promise = new DeferredPromise<any>()
    this.requests.set(id, { promise, stack: new Error().stack })

    // Send request
    this.send({ id, method, params })

    // Waiting to be complete.
    return await promise.promise
  }
}
