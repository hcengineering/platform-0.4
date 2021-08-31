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

import core, { TDerivedData, TDoc } from '@anticrm/model-core'
import { Account, Domain, Ref, Class, Doc, Tx } from '@anticrm/core'

import notification from '@anticrm/notification'
import type { Notification, Subscribe } from '@anticrm/notification'

const DOMAIN_NOTIFICATION = 'notification' as Domain

/**
 * @public
 */
@Model(notification.class.Notification, core.class.DerivedData, DOMAIN_NOTIFICATION)
export class TNotification extends TDerivedData implements Notification {
  client!: Ref<Account>
  tx!: Ref<Tx>
}

/**
 * @public
 */
@Model(notification.class.Subscribe, core.class.Doc, DOMAIN_NOTIFICATION)
export class TSubscribe extends TDoc implements Subscribe<Doc> {
  objectId!: Ref<Doc>
  objectClass!: Ref<Class<Doc>>
  clients!: Ref<Account>[]
}

/**
 * @public
 */
export function createModel (builder: Builder): void {
  builder.createModel(TNotification, TSubscribe)

  // D E R I V E D   D A T A
  builder.createDoc(core.class.DerivedDataDescriptor, {
    sourceClass: core.class.Doc,
    targetClass: notification.class.Notification,
    mapper: notification.mapper.NotificationMapper
  })
}
