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
  Tx,
  registerMapper,
  TxRemoveDoc,
  TxUpdateDoc,
  generateId,
  TxCreateDoc
} from '@anticrm/core'

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

  registerMapper(notification.mapper.NotificationMapper, {
    map: async (tx, options): Promise<Notification[]> => {
      switch (tx._class) {
        case core.class.TxCreateDoc: {
          const res: Notification[] = []
          const ctx = tx as TxCreateDoc<Doc>
          const spaceSubscribes = await options.storage.findAll(notification.class.Subscribe, {
            objectId: ctx.objectSpace
          })
          for (const subscribe of spaceSubscribes) {
            if (!options.hierarchy.isDerived(ctx.objectClass, subscribe.objectClass)) continue
            for (const client of subscribe.clients) {
              if (client === ctx.modifiedBy) continue
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
          }
          return res
        }
        case core.class.TxUpdateDoc: {
          const res: Notification[] = []
          const ctx = tx as TxUpdateDoc<Doc>
          const subscribe = (
            await options.storage.findAll(notification.class.Subscribe, { objectId: ctx.objectId })
          ).shift()
          if (subscribe !== undefined) {
            for (const client of subscribe.clients) {
              if (client === ctx.modifiedBy) continue
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
          }
          const spaceSubscribes = await options.storage.findAll(notification.class.Subscribe, {
            objectId: ctx.objectSpace
          })
          for (const spaceSubscribe of spaceSubscribes) {
            if (!options.hierarchy.isDerived(ctx.objectClass, spaceSubscribe.objectClass)) continue
            for (const client of spaceSubscribe.clients) {
              if (client === ctx.modifiedBy) continue
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
          }
          return res
        }
        case core.class.TxRemoveDoc: {
          const ctx = tx as TxRemoveDoc<Doc>
          const subscribe = (
            await options.storage.findAll(notification.class.Subscribe, { objectId: ctx.objectId })
          ).shift()
          if (subscribe === undefined) return []
          const notifications = await options.storage.findAll(notification.class.Notification, {
            objectId: ctx.objectId
          })
          const removeTx: TxRemoveDoc<Subscribe<Doc>> = {
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
          for (const notify of notifications) {
            const removeTx: TxRemoveDoc<Notification> = {
              _class: core.class.TxRemoveDoc,
              objectClass: notify._class,
              objectId: notify._id,
              createOn: Date.now(),
              modifiedBy: ctx.modifiedBy,
              modifiedOn: Date.now(),
              space: core.space.Tx,
              objectSpace: notify.space,
              _id: generateId()
            }
            await options.storage.tx(removeTx)
          }
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
