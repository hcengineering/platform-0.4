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

import type { Class, Doc, DerivedData, DocumentMapper, Ref, Timestamp, DerivedDataDescriptor } from '@anticrm/core'
import type { Plugin, Service } from '@anticrm/platform'
import { plugin } from '@anticrm/platform'
import type { Resource } from '@anticrm/status'

export interface SpaceNotifications extends DerivedData {
  lastRead: Timestamp
  objectLastReads: Map<Ref<Doc>, Timestamp>
  notificatedObjects: Array<Ref<Doc>>
}

export interface SpaceInfo extends DerivedData {
  lastModified: Timestamp
}

export interface NotificationService extends Service {}

const notificationPlugin = 'notification' as Plugin<NotificationService>

export default plugin(
  notificationPlugin,
  {},
  {
    class: {
      SpaceNotifications: '' as Ref<Class<SpaceNotifications>>,
      SpaceInfo: '' as Ref<Class<SpaceInfo>>
    },
    mappers: {
      SpaceInfo: '' as Resource<DocumentMapper>,
      SpaceNotification: '' as Resource<DocumentMapper>
    },
    dd: {
      SpaceInfo: '' as Ref<DerivedDataDescriptor<Doc, Doc>>,
      SpaceNotifications: '' as Ref<DerivedDataDescriptor<Doc, Doc>>
    }
  }
)
