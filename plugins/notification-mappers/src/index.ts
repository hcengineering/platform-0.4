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

import core, { generateId, registerMapper, parseFullRef, DerivedData, DerivedDataDescriptor } from '@anticrm/core'
import type { Account, Doc, Ref, TxCreateDoc, TxRemoveDoc, TxUpdateDoc, MappingOptions, Tx } from '@anticrm/core'
import type { Subscribe, Notification } from '@anticrm/notification'
import notification from '@anticrm/notification'
import chunter from '@anticrm/chunter'
import type { Comment } from '@anticrm/chunter'

export default function regNotificationMappers (): void {
  registerMapper(notification.mapper.NotificationMapper, {
    map: notificationMapper
  })

  registerMapper(chunter.mapper.CommentNotificationMapper, {
    map: commentNotificationMap
  })
}

async function commentNotificationMap (tx: Tx<Doc>, options: MappingOptions): Promise<Notification[]> {
  switch (tx._class) {
    case core.class.TxCreateDoc: {
      const ctx = tx as TxCreateDoc<Comment>
      const parentDocRef = parseFullRef(ctx.attributes.replyOf)
      const commentsAuthors = (
        await options.storage.findAll(chunter.class.Comment, { replyOf: ctx.attributes.replyOf })
      ).map((p) => p.modifiedBy)
      const clients = new Set<Ref<Account>>(commentsAuthors)
      const doc = (await options.storage.findAll(parentDocRef._class, { _id: parentDocRef._id }, { limit: 1 })).shift()
      if (doc === undefined) return []
      clients.add(doc.modifiedBy)
      return createClientsNotifications(clients, ctx, options.descriptor)
    }
  }
  return []
}

async function notificationMapper (tx: Tx<Doc>, options: MappingOptions): Promise<Notification[]> {
  switch (tx._class) {
    case core.class.TxCreateDoc: {
      const ctx = tx as TxCreateDoc<Doc>
      return await createSpaceNotifications(options, ctx)
    }
    case core.class.TxUpdateDoc: {
      const ctx = tx as TxUpdateDoc<Doc>
      const res = await createObjectNotifications(options, ctx)
      ;(await createSpaceNotifications(options, ctx)).forEach((p) => res.push(p))
      return res
    }
    case core.class.TxRemoveDoc: {
      const ctx = tx as TxRemoveDoc<Doc>
      const subscribe = (
        await options.storage.findAll(notification.class.Subscribe, { objectId: ctx.objectId })
      ).shift()
      if (subscribe !== undefined) {
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
      }
      const notifications = await options.storage.findAll(notification.class.Notification, {
        objectId: ctx.objectId
      })
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

async function createSpaceNotifications (
  options: MappingOptions,
  ctx: TxCreateDoc<Doc> | TxUpdateDoc<Doc>
): Promise<Notification[]> {
  const res: Notification[] = []
  const spaceSubscribes = await options.storage.findAll(notification.class.Subscribe, {
    objectId: ctx.objectSpace
  })
  for (const spaceSubscribe of spaceSubscribes) {
    if (options.hierarchy.isDerived(ctx.objectClass, spaceSubscribe.objectClass)) {
      createClientsNotifications(spaceSubscribe.clients, ctx, options.descriptor).forEach((p) => res.push(p))
    }
  }
  return res
}

async function createObjectNotifications (options: MappingOptions, ctx: TxUpdateDoc<Doc>): Promise<Notification[]> {
  const subscribe = (await options.storage.findAll(notification.class.Subscribe, { objectId: ctx.objectId })).shift()
  if (subscribe === undefined) return []
  return createClientsNotifications(subscribe.clients, ctx, options.descriptor)
}

function createClientsNotifications (
  clients: Array<Ref<Account>> | Set<Ref<Account>>,
  ctx: TxCreateDoc<Doc> | TxUpdateDoc<Doc>,
  descriptor: DerivedDataDescriptor<Doc, DerivedData>
): Notification[] {
  const res: Notification[] = []
  for (const client of clients) {
    if (client === ctx.modifiedBy) continue
    const result: Notification = {
      _class: descriptor.targetClass,
      objectId: ctx.objectId,
      objectClass: ctx.objectClass,
      _id: `dd-${generateId()}` as Ref<Notification>,
      modifiedBy: ctx.modifiedBy,
      modifiedOn: Date.now(),
      createOn: Date.now(),
      space: ctx.objectSpace,
      descriptorId: descriptor._id,
      tx: ctx._id,
      client: client
    }
    res.push(result)
  }
  return res
}
