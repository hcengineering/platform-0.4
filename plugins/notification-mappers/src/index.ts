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

import core, {
  Doc,
  MappingOptions,
  Tx,
  TxCreateDoc,
  TxUpdateDoc,
  generateId,
  Ref,
  Space,
  TxProcessor,
  Timestamp,
  Account,
  DerivedDataDescriptor,
  DerivedData,
  registerMapper,
  ObjectTx,
  isEachArray,
  isPredicate,
  createPredicates
} from '@anticrm/core'
import notification, { SpaceInfo, SpaceNotifications } from '@anticrm/notification'

async function updateSpaceInfo<T extends Doc> (tx: ObjectTx<T>, options: MappingOptions): Promise<void> {
  const spaceInfo = (
    await options.storage.findAll<SpaceInfo>(notification.class.SpaceInfo, { objectId: tx.objectSpace })
  )[0]
  if (spaceInfo === undefined) return
  const updateTx: TxUpdateDoc<SpaceInfo> = {
    objectId: spaceInfo._id,
    objectSpace: spaceInfo.space,
    objectClass: spaceInfo._class,
    _id: generateId(),
    _class: core.class.TxUpdateDoc,
    space: core.space.Tx,
    modifiedBy: tx.modifiedBy,
    modifiedOn: tx.modifiedOn,
    createOn: tx.createOn,
    operations: {
      lastModified: tx.modifiedOn
    }
  }

  await options.storage.tx(updateTx)
}

function createSpaceNotification<T extends Space> (
  ctx: TxCreateDoc<T> | TxUpdateDoc<T>,
  options: MappingOptions,
  member: Ref<Account>
): SpaceNotifications {
  return {
    _id: `${ctx.objectId}-${member}` as Ref<SpaceNotifications>,
    lastRead: ctx.modifiedOn,
    createOn: ctx.createOn,
    descriptorId: options.descriptor._id,
    space: member.toString() as Ref<Space>,
    objectClass: ctx.objectClass,
    objectId: ctx.objectId,
    modifiedOn: ctx.modifiedOn,
    _class: notification.class.SpaceNotifications,
    modifiedBy: ctx.modifiedBy,
    notificatedObjects: [],
    objectLastReads: new Map<Ref<Doc>, Timestamp>()
  }
}

function createSpaceInfo<T extends Space> (
  ctx: TxCreateDoc<T> | TxUpdateDoc<T>,
  descriptorId: Ref<DerivedDataDescriptor<Doc, DerivedData>>
): SpaceInfo {
  const data: SpaceInfo = {
    _class: notification.class.SpaceInfo,
    objectId: ctx.objectId,
    objectClass: ctx.objectClass,
    _id: `dd-spaceInfo-${ctx.objectId}` as Ref<SpaceInfo>,
    modifiedBy: ctx.modifiedBy,
    modifiedOn: ctx.modifiedOn,
    createOn: ctx.createOn,
    space: ctx.objectId,
    descriptorId: descriptorId,
    lastModified: ctx.modifiedOn
  }
  return data
}

function addSpaceMember (
  ctx: TxUpdateDoc<Space> | TxCreateDoc<Space>,
  options: MappingOptions,
  member: Ref<Account>,
  result: SpaceNotifications[]
): void {
  const spaceNotification = createSpaceNotification(ctx, options, member)
  if (result.findIndex((p) => p._id === spaceNotification._id) === -1) {
    result.push(spaceNotification)
  }
}

async function createDocSpaceInfoHandler (ctx: TxCreateDoc<Doc>, options: MappingOptions): Promise<SpaceInfo[]> {
  if (options.hierarchy.isDerived(ctx.objectClass, core.class.Space)) {
    return [createSpaceInfo(ctx as TxCreateDoc<Space>, options.descriptor._id)]
  }
  await tryUpdateSpaceInfo(ctx, options)
  return []
}

async function updateDocSpaceInfoHandler (ctx: TxUpdateDoc<Doc>, options: MappingOptions): Promise<SpaceInfo[]> {
  if (options.hierarchy.isDerived(ctx.objectClass, core.class.Space)) {
    const result = await options.storage.findAll(notification.class.SpaceInfo, { objectId: ctx.objectId })
    return result.length > 0 ? result : [createSpaceInfo(ctx as TxUpdateDoc<Space>, options.descriptor._id)]
  }
  await tryUpdateSpaceInfo(ctx, options)
  return []
}

async function tryUpdateSpaceInfo (ctx: TxUpdateDoc<Doc> | TxCreateDoc<Doc>, options: MappingOptions): Promise<void> {
  if (ctx.objectSpace !== core.space.Model && !options.hierarchy.isDerived(ctx.objectClass, core.class.DerivedData)) {
    await updateSpaceInfo(ctx, options)
  }
}

async function createSpaceHandler (ctx: TxCreateDoc<Space>, options: MappingOptions): Promise<SpaceNotifications[]> {
  const result: SpaceNotifications[] = []
  const doc = TxProcessor.createDoc2Doc(ctx) as Space
  for (const member of doc.members) {
    addSpaceMember(ctx, options, member, result)
  }
  return result
}

async function updateSpaceHandler (ctx: TxUpdateDoc<Space>, options: MappingOptions): Promise<SpaceNotifications[]> {
  let result: SpaceNotifications[] = await options.storage.findAll(notification.class.SpaceNotifications, {
    objectId: ctx.objectId
  })
  pullMembers(result, ctx)
  pushMembers(result, ctx, options)
  if (ctx.operations.members !== undefined) {
    for (let i = 0; i < result.length; i++) {
      const member = result[i].space.toString() as Ref<Account>
      if (!ctx.operations.members.includes(member)) {
        result = result.splice(i, 1)
      }
    }
    for (const member of ctx.operations.members) {
      addSpaceMember(ctx, options, member, result)
    }
  }
  return result
}

function pushMembers (result: SpaceNotifications[], ctx: TxUpdateDoc<Space>, options: MappingOptions): void {
  const pushMembers = ctx.operations?.$push?.members
  if (pushMembers !== undefined) {
    if (isEachArray(pushMembers)) {
      for (const member of pushMembers.$each) {
        addSpaceMember(ctx, options, member, result)
      }
    } else {
      addSpaceMember(ctx, options, pushMembers, result)
    }
  }
}

function pullMembers (result: SpaceNotifications[], ctx: TxUpdateDoc<Space>): void {
  if (ctx.operations.$pull?.members !== undefined) {
    let pulled: any[] = []
    if (isPredicate(ctx.operations.$pull.members)) {
      const preds = createPredicates(ctx.operations.$pull.members, 'space')
      let temp = Array.from(result) as Doc[]
      for (const pred of preds) {
        temp = pred(temp)
      }
      pulled = temp.map((p) => p.space.toString() as Ref<Account>)
    } else {
      pulled = [ctx.operations.$pull?.members]
    }
    for (const member of pulled) {
      const pos = result.findIndex((p) => p.space.toString() === member)
      if (pos !== -1) {
        result = result.splice(pos, 1)
      }
    }
  }
}

export default (): void => {
  registerMapper(notification.mappers.SpaceInfo, {
    map: async (tx: Tx, options: MappingOptions): Promise<SpaceInfo[]> => {
      if (tx._class === core.class.TxCreateDoc) {
        const ctx = tx as TxCreateDoc<Doc>
        return await createDocSpaceInfoHandler(ctx, options)
      }

      if (tx._class === core.class.TxUpdateDoc) {
        const ctx = tx as TxUpdateDoc<Doc>
        return await updateDocSpaceInfoHandler(ctx, options)
      }

      return []
    }
  })

  registerMapper(notification.mappers.SpaceNotification, {
    map: async (tx: Tx, options: MappingOptions): Promise<SpaceNotifications[]> => {
      if (tx._class === core.class.TxCreateDoc) {
        const ctx = tx as TxCreateDoc<Space>
        return await createSpaceHandler(ctx, options)
      }

      if (tx._class === core.class.TxUpdateDoc) {
        const ctx = tx as TxUpdateDoc<Space>
        return await updateSpaceHandler(ctx, options)
      }

      return []
    }
  })
}
