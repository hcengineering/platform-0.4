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
import type { Ref, Class, Doc, Space, Account, Timestamp, Tx, DocumentMapper, DerivedData } from '@anticrm/core'
import type { IntlString, Plugin, Service } from '@anticrm/platform'
import type { Resource } from '@anticrm/status'
import { plugin } from '@anticrm/platform'

export interface SpaceSubscribe<T extends Doc> extends Doc {
  objectClass: Ref<Class<T>>
  client: Ref<Account>
  lastTime: Timestamp
}

export interface ObjectSubscribe<T extends Doc> extends Doc {
  objectId: Ref<T>
  objectClass: Ref<Class<T>>
  clients: Array<Ref<Account>>
}

export interface Notification extends DerivedData {
  client: Ref<Account>
  tx: Ref<Tx>
}

export interface NotificationService extends Service {
  markAsRead: <T extends Doc>(
    objectClass: Ref<Class<T>>,
    space: Ref<Space>,
    withObjects?: boolean,
    toTime?: Timestamp
  ) => Promise<void>

  markAsReadObject: <T extends Doc>(objectClass: Ref<Class<T>>, space: Ref<Space>, objectId: Ref<T>) => Promise<void>

  getSubscibeStatus: <T extends Doc>(_class: Ref<Class<T>>, space: Ref<Space>) => Promise<boolean>

  getObjectSubscibeStatus: <T extends Doc>(
    _class: Ref<Class<T>>,
    space: Ref<Space>,
    objectId: Ref<T>
  ) => Promise<boolean>

  subscribeSpace: <T extends Doc>(_class: Ref<Class<T>>, space: Ref<Space>) => Promise<void>

  subscribeObject: <T extends Doc>(_class: Ref<Class<T>>, space: Ref<Space>, objectId: Ref<T>) => Promise<void>

  unsubscribeSpace: <T extends Doc>(_class: Ref<Class<T>>, space: Ref<Space>) => Promise<void>

  unsubscribeObject: <T extends Doc>(_class: Ref<Class<T>>, space: Ref<Space>, objectId: Ref<T>) => Promise<void>

  spaceNotifications: <T extends Doc>(
    _class: Ref<Class<T>>,
    space: Ref<Space>,
    callback: (result: T[]) => void
  ) => () => void

  objectNotifications: <T extends Doc>(
    _class: Ref<Class<T>>,
    space: Ref<Space>,
    objectId: Ref<T>,
    callback: (result: Notification[]) => void
  ) => () => void
}

const PluginNotification = 'notification' as Plugin<NotificationService>

const notification = plugin(
  PluginNotification,
  {},
  {
    class: {
      Notification: '' as Ref<Class<Notification>>,
      SpaceSubscribe: '' as Ref<Class<SpaceSubscribe<Doc>>>,
      ObjectSubscribe: '' as Ref<Class<ObjectSubscribe<Doc>>>
    },
    string: {
      Subscribe: '' as IntlString,
      Unsubscribe: '' as IntlString
    },
    mapper: {
      NotificationMapper: '' as Resource<DocumentMapper>
    }
  }
)

export default notification
