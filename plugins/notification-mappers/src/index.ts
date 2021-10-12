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
  Ref,
  Space,
  TxProcessor,
  Timestamp,
  Account,
  registerMapper,
  isEachArray,
  isPredicate,
  createPredicates
} from '@anticrm/core'
import notification, { SpaceLastViews } from '@anticrm/notification'

function createSpaceNotification<T extends Space> (
  ctx: TxCreateDoc<T> | TxUpdateDoc<T>,
  options: MappingOptions,
  member: Ref<Account>
): SpaceLastViews {
  return {
    _id: `${ctx.objectId}-${member}` as Ref<SpaceLastViews>,
    lastRead: ctx.modifiedOn,
    createOn: ctx.createOn,
    descriptorId: options.descriptor._id,
    space: member.toString() as Ref<Space>,
    objectClass: ctx.objectClass,
    objectId: ctx.objectId,
    modifiedOn: ctx.modifiedOn,
    _class: notification.class.SpaceLastViews,
    modifiedBy: ctx.modifiedBy,
    notificatedObjects: [],
    objectLastReads: new Map<Ref<Doc>, Timestamp>()
  }
}

function addSpaceMember (
  ctx: TxUpdateDoc<Space> | TxCreateDoc<Space>,
  options: MappingOptions,
  member: Ref<Account>,
  result: SpaceLastViews[]
): void {
  const spaceNotification = createSpaceNotification(ctx, options, member)
  if (result.findIndex((p) => p._id === spaceNotification._id) === -1) {
    result.push(spaceNotification)
  }
}

async function createSpaceHandler (ctx: TxCreateDoc<Space>, options: MappingOptions): Promise<SpaceLastViews[]> {
  const result: SpaceLastViews[] = []
  const doc = TxProcessor.createDoc2Doc(ctx) as Space
  for (const member of doc.members) {
    addSpaceMember(ctx, options, member, result)
  }
  return result
}

async function updateSpaceHandler (ctx: TxUpdateDoc<Space>, options: MappingOptions): Promise<SpaceLastViews[]> {
  let result: SpaceLastViews[] = await options.storage.findAll(notification.class.SpaceLastViews, {
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

function pushMembers (result: SpaceLastViews[], ctx: TxUpdateDoc<Space>, options: MappingOptions): void {
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

function pullMembers (result: SpaceLastViews[], ctx: TxUpdateDoc<Space>): void {
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

export default async (): Promise<void> => {
  registerMapper(notification.mappers.SpaceLastViews, {
    map: async (tx: Tx, options: MappingOptions): Promise<SpaceLastViews[]> => {
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
