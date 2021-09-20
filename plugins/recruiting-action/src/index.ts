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

import type { Ref, Space } from '@anticrm/core'
import core, { generateId } from '@anticrm/core'
import type { RecruitingService } from '@anticrm/recruiting'
import { setResource } from '@anticrm/platform'
import { Action } from '@anticrm/action'
import recruiting from '@anticrm/recruiting'
import calendar from '@anticrm/calendar'
import type { Event } from '@anticrm/calendar'
import chunter from '@anticrm/chunter'

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

const Interview = new Action()
  .call(calendar.action.waitForEvent)
  .exec(async (ctx) => {
    const eventID: Ref<Event> = ctx.pop()
    const event = (await ctx.findAll(calendar.class.Event, { _id: eventID }))[0]

    if (event === undefined) {
      throw Error(`Event is not found: ${eventID}`)
    }

    event.participants.forEach((user) => {
      const id = generateId()
      ctx.create({
        id,
        space: user.toString() as Ref<Space>,
        clazz: recruiting.class.FeedbackRequest,
        attributes: {
          parent: event._id,
          targetSpace: event.space
        }
      })

      ctx.create({
        space: user.toString() as Ref<Space>,
        clazz: chunter.class.Message,
        attributes: {
          message: `[${event.name}](ref://calendar.Event#${event._id}) has finished. Your [feedback](ref://recruiting.FeedbackRequest#${id}) is required.`,
          isChunterbot: true
        }
      })
    })

    return eventID
  })
  .exec(async (ctx) => {
    const eventID: Ref<Event> = ctx.pop()
    const event = (await ctx.findAll(calendar.class.Event, { _id: eventID }))[0]

    if (event === undefined) {
      throw Error(`Event is not found: ${eventID}`)
    }

    let feedbackAuthors = (await ctx.findAll(recruiting.class.DerivedFeedback, {
      parent: eventID
    })).map(x => x.modifiedBy)

    let update = new DeferredPromise<typeof feedbackAuthors>()

    const unsub = ctx.subscribe({ clazz: recruiting.class.Feedback }, async (tx) => {
      if (tx._class === core.class.TxUpdateDoc) {
        return
      }

      update.resolve([...feedbackAuthors, tx.modifiedBy])
      update = new DeferredPromise()
    })

    while (!event.participants.every(x => feedbackAuthors.some(a => a === x))) {
      feedbackAuthors = await update.promise
    }

    unsub()
  })

export default async (): Promise<RecruitingService> => {
  setResource(recruiting.action.Interview, Interview)
  return {}
}
