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
import {
  Account,
  Domain,
  Ref,
  Class,
  Doc,
  Timestamp,
  Tx,
  registerMapper,
  TxRemoveDoc,
  TxUpdateDoc,
  generateId
} from '@anticrm/core'

import notification from '@anticrm/notification'
import type { Notification, SpaceSubscribe, ObjectSubscribe } from '@anticrm/notification'

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
@Model(notification.class.SpaceSubscribe, core.class.Doc, DOMAIN_NOTIFICATION)
export class TSpaceSubscribe extends TDoc implements SpaceSubscribe<Doc> {
  objectClass!: Ref<Class<Doc>>
  client!: Ref<Account>
  lastTime!: Timestamp
}

/**
 * @public
 */
@Model(notification.class.ObjectSubscribe, core.class.Doc, DOMAIN_NOTIFICATION)
export class TObjectSubscribe extends TDoc implements ObjectSubscribe<Doc> {
  objectId!: Ref<Doc>
  objectClass!: Ref<Class<Doc>>
  clients!: Ref<Account>[]
}

/**
 * @public
 */
export function createModel (builder: Builder): void {
  builder.createModel(TNotification, TSpaceSubscribe, TObjectSubscribe)

  registerMapper(notification.mapper.NotificationMapper, {
    map: async (tx, options): Promise<Notification[]> => {
      switch (tx._class) {
        case core.class.TxUpdateDoc: {
          const res: Notification[] = []
          const ctx = tx as TxUpdateDoc<Doc>
          const subscribe = (
            await options.storage.findAll(notification.class.ObjectSubscribe, { objectId: ctx.objectId })
          ).shift()
          if (subscribe === undefined) return []
          for (const client of subscribe.clients) {
            const result: Notification = {
              _class: options.descriptor.targetClass,
              objectId: ctx.objectId,
              objectClass: ctx.objectClass,
              _id: `dd-${generateId()}` as Ref<Notification>,
              modifiedBy: ctx.modifiedBy,
              modifiedOn: Date.now(),
              createOn: Date.now(),
              space: ctx.objectSpace,
              descriptorId: options.descriptor._id,
              tx: ctx._id,
              client: client
            }
            res.push(result)
          }
          return res
        }
        case core.class.TxRemoveDoc: {
          const res: Notification[] = []
          const ctx = tx as TxUpdateDoc<Doc>
          const subscribe = (
            await options.storage.findAll(notification.class.ObjectSubscribe, { objectId: ctx.objectId })
          ).shift()
          if (subscribe === undefined) return []
          for (const client of subscribe.clients) {
            const result: Notification = {
              _class: options.descriptor.targetClass,
              objectId: ctx.objectId,
              objectClass: ctx.objectClass,
              _id: `dd-${generateId()}` as Ref<Notification>,
              modifiedBy: ctx.modifiedBy,
              modifiedOn: Date.now(),
              createOn: Date.now(),
              space: ctx.objectSpace,
              descriptorId: options.descriptor._id,
              tx: ctx._id,
              client: client
            }
            res.push(result)
          }
          const removeTx: TxRemoveDoc<ObjectSubscribe<Doc>> = {
            _class: core.class.TxRemoveDoc,
            objectClass: subscribe._class,
            objectId: subscribe._id,
            createOn: Date.now(),
            modifiedBy: ctx.modifiedBy,
            modifiedOn: Date.now(),
            space: core.space.Tx,
            objectSpace: subscribe.space,
            _id: generateId()
          }
          await options.storage.tx(removeTx)
          return res
        }
      }
      return []
    }
  })

  // D E R I V E D   D A T A
  builder.createDoc(core.class.DerivedDataDescriptor, {
    sourceClass: core.class.Doc,
    targetClass: notification.class.Notification,
    mapper: notification.mapper.NotificationMapper
  })
}
