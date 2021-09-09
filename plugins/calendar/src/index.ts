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

import type { Account, Class, DerivedDataDescriptor, Doc, DocumentMapper, Ref, Space, Timestamp } from '@anticrm/core'
import type { AnyComponent, Asset, IntlString, Resource } from '@anticrm/status'
import { DerivedData } from '@anticrm/core'
import type { Plugin, Service } from '@anticrm/platform'
import { plugin } from '@anticrm/platform'

export interface Calendar extends Space {}

export interface Event extends Doc {
  name: string
  description: string
  startsAt: Timestamp
  endsAt: Timestamp
  participants: Array<Ref<Account>>
  version: number
  owner: Ref<Account>
}
export interface DerivedEvent extends Event, DerivedData {
  orig: Ref<Event>
}

export interface CalendarService extends Service {}

const PluginCalendar = 'calendar' as Plugin<CalendarService>

export default plugin(PluginCalendar, {}, {
  icon: {
    Calendar: '' as Asset
  },
  class: {
    Calendar: '' as Ref<Class<Calendar>>,
    Event: '' as Ref<Class<Event>>,
    DerivedEvent: '' as Ref<Class<DerivedEvent>>
  },
  component: {
    CreateEvent: '' as AnyComponent,
    EditEvent: '' as AnyComponent,
    CreateCalendar: '' as AnyComponent,
    Workspace: '' as AnyComponent
  },
  string: {
    App: '' as IntlString,
    Calendar: '' as IntlString,
    AddCalendar: '' as IntlString,
    Name: '' as IntlString,
    Description: '' as IntlString,
    MakePrivate: '' as IntlString,
    MakePrivateDescription: '' as IntlString,
    AddEvent: '' as IntlString,
    Title: '' as IntlString,
    StartTime: '' as IntlString,
    EndTime: '' as IntlString,
    Participants: '' as IntlString
  },
  mapper: {
    defaultMapper: '' as Resource<DocumentMapper>
  },
  dd: {
    NameTitleIndex: '' as Ref<DerivedDataDescriptor<Doc, Doc>>
  }
})
