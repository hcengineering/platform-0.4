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

import type { Ref, TxUpdateDoc } from '@anticrm/core'
import type { CalendarService, Event } from '@anticrm/calendar'
import { setResource } from '@anticrm/platform'
import calendar from '@anticrm/calendar'
import { Action } from '@anticrm/action'

const wait = async <T>(p: Promise<T>, delay: number): Promise<null | T> => {
  if (delay <= 0) {
    return null
  }

  let tid: number | undefined
  let delayResolve = (x: null): void => {}
  const res = await Promise.race([
    p,
    new Promise<null>(resolve => {
      delayResolve = resolve
      tid = setTimeout(() => resolve(null), delay) as unknown as number
    })
  ])

  if (res !== null) {
    delayResolve(null)

    if (tid !== undefined) {
      clearTimeout(tid)
    }
  }

  return res
}

class DeferredPromise<T> {
  promise: Promise<T>
  resolve!: (value: T) => void
  reject!: (reason?: any) => void
  constructor () {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    })
  }
}

const waitForEvent = new Action()
  .exec(
    async (ctx) => {
      const eventID: Ref<Event> = ctx.pop()
      const event = (await ctx.findAll(calendar.class.Event, { _id: eventID }))[0]

      if (event === undefined) {
        throw Error(`Event is not found: ${eventID}`)
      }

      let { endsAt } = event
      let update = new DeferredPromise<number>()

      const unsub = ctx.subscribe({ id: event._id }, async (tx) => {
        const ttx = tx as never as TxUpdateDoc<Event>

        if (ttx.operations.endsAt !== undefined && ttx.operations.endsAt !== endsAt) {
          update.resolve(ttx.operations.endsAt)
          update = new DeferredPromise()
        }
      })

      while (true) {
        const res = await wait(update.promise, endsAt - new Date().getTime())

        if (res === null) {
          break
        }

        endsAt = res
      }

      unsub()

      return eventID
    }
  )

export default async (): Promise<CalendarService> => {
  setResource(calendar.action.waitForEvent, waitForEvent)

  return {}
}
