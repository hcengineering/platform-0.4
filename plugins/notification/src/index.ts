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
import type { Ref, Class, Doc, Space, Account, Timestamp } from '@anticrm/core'
import type { Plugin, Service } from '@anticrm/platform'
import { plugin } from '@anticrm/platform'

export interface LastViewed extends Doc {
  objectClass: Ref<Class<Doc>>
  objectSpace: Ref<Space>
  client: Ref<Account>
  lastTime: Timestamp
  objectIDs?: Ref<Doc>[]
}

export interface Notification extends Doc {
  objectClass: Ref<Class<Doc>>
  objectSpace: Ref<Space>
  objectId: Ref<Doc>
  client: Ref<Account>
}

export interface NotificationService extends Service {}

const PluginNotification = 'notification' as Plugin<NotificationService>

export default plugin(
  PluginNotification,
  {},
  {
    class: {
      Notification: '' as Ref<Class<Notification>>,
      LastViewed: '' as Ref<Class<LastViewed>>
    }
  }
)
