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

import { DerivedData, Doc, MappingOptions, Tx, TxCreateDoc, TxProcessor, Ref, Account, generateId, DerivedDataDescriptor, TxUpdateDoc, TxRemoveDoc, Space } from '@anticrm/core'
import core, { registerMapper } from '@anticrm/core'
import type { DerivedEvent, Event } from '@anticrm/calendar'
import calendar from '@anticrm/calendar'

async function createEvent (event: Event, participant: Ref<Account>, d: DerivedDataDescriptor<Doc, DerivedData>, options: MappingOptions): Promise<(DerivedEvent & DerivedData)[]> {
  return [
    {
      ...event,
      _id: `dd-${generateId()}` as Ref<DerivedEvent>,
      _class: calendar.class.DerivedEvent,
      objectId: event._id,
      objectClass: event._class,
      owner: participant,
      modifiedOn: Date.now(),
      createOn: Date.now(),
      orig: event._id,
      space: participant.toString() as Ref<Space>,
      descriptorId: d._id
    }
  ]
}

export default (): void => {
  registerMapper(calendar.mapper.defaultMapper, {
    map: async (tx: Tx, options: MappingOptions): Promise<DerivedData[]> => {
      if (tx._class === core.class.TxCreateDoc) {
        const ttx = tx as TxCreateDoc<Doc>

        if (options.hierarchy.isDerived(ttx.objectClass, calendar.class.Event)) {
          const event = TxProcessor.createDoc2Doc(ttx) as Event
          const participants = event.participants.filter(x => x !== event.owner)

          return await Promise
            .all(participants.map(async x => await createEvent(event, x, options.descriptor, options)))
            .then(xs => xs.reduce((r, x) => r.concat(x), []))
        }
      }

      if (tx._class === core.class.TxUpdateDoc) {
        const ttx = tx as TxUpdateDoc<Doc>

        if (options.hierarchy.isDerived(ttx.objectClass, calendar.class.Event)) {
          const origEvent = (await options.storage.findAll(calendar.class.Event, { _id: ttx.objectId as Ref<Event> }))[0]

          if (origEvent === undefined) {
            return []
          }

          const derivedEvents = await options.storage.findAll(calendar.class.DerivedEvent, { orig: ttx.objectId as Ref<Event> })
          const derivedParticipants = new Set(derivedEvents.map(x => x.owner))
          const existingParticipants = origEvent.participants.filter(x => derivedParticipants.has(x))
          const newParticipants = origEvent.participants.filter(x => !derivedParticipants.has(x) && x !== origEvent.owner)

          const newEvents = await Promise
            .all(newParticipants.map(async x => await createEvent(origEvent, x, options.descriptor, options)))
            .then(xs => xs.reduce((r, x) => r.concat(x), []))
          return derivedEvents
            .filter(x => existingParticipants.includes(x.owner))
            .map(event => ({
              ...origEvent,
              _id: event._id,
              _class: event._class,
              objectId: event.objectId,
              objectClass: event.objectClass,
              owner: event.owner,
              modifiedBy: event.modifiedBy,
              modifiedOn: Date.now(),
              createOn: event.createOn,
              orig: event.orig,
              space: event.space,
              descriptorId: event.descriptorId
            }))
            .concat(newEvents)
        }
      }

      if (tx._class === core.class.TxRemoveDoc) {
        const ttx = tx as TxRemoveDoc<Doc>

        if (options.hierarchy.isDerived(ttx.objectClass, calendar.class.Event)) {
          return []
        }
      }

      return []
    }
  })
}
