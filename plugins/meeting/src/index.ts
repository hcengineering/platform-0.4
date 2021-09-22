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

import { plugin, Metadata } from '@anticrm/platform'
import type { AnyComponent, Asset, IntlString } from '@anticrm/status'
import type { Plugin, Service } from '@anticrm/platform'
import { Application } from '@anticrm/workbench'
import type { Class, Ref, Space } from '@anticrm/core'

export interface RoomSpace extends Space {}

export interface MeetingService extends Service {}

const PluginMeeting = 'meeting' as Plugin<MeetingService>

export default plugin(PluginMeeting, {}, {
  app: {
    Meeting: '' as Ref<Application>
  },
  metadata: {
    ClientUrl: '' as Metadata<string>
  },
  icon: {
    Meeting: '' as Asset,
    Hashtag: '' as Asset
  },
  class: {
    RoomSpace: '' as Ref<Class<RoomSpace>>
  },
  string: {
    App: '' as IntlString,
    Rooms: '' as IntlString,
    CreateRoom: '' as IntlString,
    Name: '' as IntlString,
    Description: '' as IntlString,
    MakeRoomPrivate: '' as IntlString,
    Join: '' as IntlString,
    Leave: '' as IntlString,
    ShareScreen: '' as IntlString,
    StopSharing: '' as IntlString,
    Mute: '' as IntlString,
    Unmute: '' as IntlString,
    EnableCam: '' as IntlString,
    DisableCam: '' as IntlString,
    Fullscreen: '' as IntlString
  },
  component: {
    CreateRoom: '' as AnyComponent,
    WorkspaceComponent: '' as AnyComponent
  }
})
