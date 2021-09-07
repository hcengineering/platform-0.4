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

import type { Domain, Doc, Timestamp, Ref } from '@anticrm/core'
import { Builder, Model } from '@anticrm/model'
import core, { TDerivedData } from '@anticrm/model-core'
import notification from '@anticrm/notification'
import type { SpaceNotifications, SpaceInfo } from '@anticrm/notification'

const DOMAIN_NOTIFICATION = 'notification' as Domain

/**
 * @public
 */
@Model(notification.class.SpaceNotifications, core.class.DerivedData, DOMAIN_NOTIFICATION)
export class TSpaceNotifications extends TDerivedData implements SpaceNotifications {
  lastRead!: Timestamp
  objectLastReads!: Map<Ref<Doc>, Timestamp>
  notificatedObjects!: Array<Ref<Doc>>
}

/**
 * @public
 */
@Model(notification.class.SpaceInfo, core.class.DerivedData, DOMAIN_NOTIFICATION)
export class TSpaceInfo extends TDerivedData implements SpaceInfo {
  lastModified!: Timestamp
}

/**
 * @public
 */
export function createModel (builder: Builder): void {
  builder.createModel(TSpaceNotifications, TSpaceInfo)

  // D E R I V E D   D A T A
  builder.createDoc(
    core.class.DerivedDataDescriptor,
    {
      sourceClass: core.class.Doc,
      targetClass: notification.class.SpaceInfo,
      mapper: notification.mappers.SpaceInfo
    },
    notification.dd.SpaceInfo
  )

  builder.createDoc(
    core.class.DerivedDataDescriptor,
    {
      sourceClass: core.class.Space,
      targetClass: notification.class.SpaceNotifications,
      mapper: notification.mappers.SpaceNotification
    },
    notification.dd.SpaceNotifications
  )
}

/**
 * @public
 */
export default notification
