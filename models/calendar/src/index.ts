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

import { Builder, Model } from '@anticrm/model'
import core, { TDoc, TSpace } from '@anticrm/model-core'
import {
  Account,
  Class,
  DerivedData,
  DerivedDataDescriptor,
  Doc,
  Domain,
  DOMAIN_MODEL,
  Ref,
  Timestamp
} from '@anticrm/core'
import workbench from '@anticrm/model-workbench'
import type { DerivedEvent, Event, Calendar } from '@anticrm/calendar'
import calendar from '@anticrm/calendar'

const DOMAIN_CALENDAR = 'calendar' as Domain

/**
 * @public
 */

@Model(calendar.class.Calendar, core.class.Space, DOMAIN_MODEL)
export class TCalendar extends TSpace implements Calendar {}

/**
 * @public
 */
@Model(calendar.class.Event, core.class.Doc, DOMAIN_CALENDAR)
export class TEvent extends TDoc implements Event {
  name!: string
  description!: string
  startsAt!: Timestamp
  endsAt!: Timestamp
  participants!: Ref<Account>[]
  version!: number
  owner!: Ref<Account>
}

/**
 * @public
 */
@Model(calendar.class.DerivedEvent, calendar.class.Event, DOMAIN_CALENDAR)
export class TDerivedEvent extends TEvent implements DerivedEvent {
  orig!: Ref<Event>
  descriptorId!: Ref<DerivedDataDescriptor<Doc, DerivedData>>
  objectId!: Ref<Doc>
  objectClass!: Ref<Class<Doc>>
}

/**
 * @public
 */
export function createModel (builder: Builder): void {
  builder.createModel(TCalendar, TEvent, TDerivedEvent)

  builder.createDoc(workbench.class.Application, {
    label: calendar.string.App,
    icon: calendar.icon.Calendar,
    navigatorModel: {
      spaces: [
        {
          label: calendar.string.Calendar,
          spaceIcon: calendar.icon.Calendar,
          spaceClass: calendar.class.Calendar,
          addSpaceLabel: calendar.string.AddCalendar,
          createComponent: calendar.component.CreateCalendar,
          userSpace: {
            name: 'Personal',
            description: 'Personal calendar',
            members: [],
            private: true
          },
          item: {
            createComponent: calendar.component.CreateEvent,
            editComponent: calendar.component.EditEvent
          }
        }
      ],
      spaceView: calendar.component.Workspace
    }
  })

  builder.createDoc(core.class.DerivedDataDescriptor, {
    targetClass: calendar.class.DerivedEvent,
    sourceClass: calendar.class.Event,
    mapper: calendar.mapper.defaultMapper
  })

  builder.createDoc(
    core.class.DerivedDataDescriptor,
    {
      sourceClass: calendar.class.Event,
      targetClass: core.class.Title,
      rules: [{ sourceField: 'name', targetField: 'title' }]
    },
    calendar.dd.NameTitleIndex
  )
}
