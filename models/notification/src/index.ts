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

import core, { TDoc } from '@anticrm/model-core'
import type { Account, Domain, Ref, Class, Doc, Timestamp } from '@anticrm/core'

import notification, { ObjectLastViewed } from '@anticrm/notification'
import type { Notification, LastViewed } from '@anticrm/notification'

const DOMAIN_NOTIFICATION = 'notification' as Domain

/**
 * @public
 */
@Model(notification.class.Notification, core.class.Doc, DOMAIN_NOTIFICATION)
export class TNotification extends TDoc implements Notification<Doc> {
  objectClass!: Ref<Class<Doc>>
  objectId!: Ref<Doc>
  client!: Ref<Account>
}

/**
 * @public
 */
@Model(notification.class.LastViewed, core.class.Doc, DOMAIN_NOTIFICATION)
export class TLastViewed extends TDoc implements LastViewed<Doc> {
  objectClass!: Ref<Class<Doc>>
  client!: Ref<Account>
  lastTime!: Timestamp
}

/**
 * @public
 */
@Model(notification.class.ObjectLastViewed, core.class.Doc, DOMAIN_NOTIFICATION)
export class TObjectLastViewed extends TDoc implements ObjectLastViewed<Doc> {
  objectClass!: Ref<Class<Doc>>
  client!: Ref<Account>
  lastTime!: Timestamp
  objectIDs!: Ref<Doc>[]
}

/**
 * @public
 */
export function createModel (builder: Builder): void {
  builder.createModel(TNotification, TLastViewed, TObjectLastViewed)
}
