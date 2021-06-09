//
// Copyright © 2020 Anticrm Platform Contributors.
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

import { component, Component } from '@anticrm/status'
import { describe, expect, it } from '@jest/globals'
import { Class, ClassifierKind, Collection, Doc, DOMAIN_MODEL, Emb, Obj, Ref } from '../classes'
import core from '../component'
import { Hierarchy } from '../hierarchy'
import { Account, Space } from '../security'
import { DocumentQuery, Storage } from '../storage'
import { Tx, TxCreateDoc } from '../tx'
import { generateId, makeEmb } from '../utils'
import { TxAddVDocCollection, TxCreateVDoc, TxUpdateVDoc, TxUpdateVDocCollection, VDoc } from '../vdoc'

const txes = require('./vdoc.tx.json') as Tx[] // eslint-disable-line @typescript-eslint/no-var-requires

interface TaskItem extends Emb {
  iname: string
}
interface Task extends VDoc {
  name: string
  items: Collection<TaskItem>
}

const taskIds = component('tasks' as Component, {
  class: {
    Task: '' as Ref<Class<Task>>,
    TaskItem: '' as Ref<Class<TaskItem>>
  }
})

const docTx: TxCreateDoc<Class<Obj>> = {
  _id: 'task_class_id' as Ref<TxCreateDoc<Class<Obj>>>,
  _class: core.class.TxCreateDoc,
  domain: DOMAIN_MODEL,
  objectId: taskIds.class.Task,
  objectClass: core.class.Class,
  attributes: {
    domain: DOMAIN_MODEL,
    kind: ClassifierKind.CLASS,
    extends: core.class.VDoc
  }
}

txes.push(docTx)

// Helper transaction construction functions

function create <T extends VDoc> (params: Omit<TxCreateVDoc<T>, '_class'>): TxCreateVDoc<T> {
  return { ...params, _class: core.class.TxCreateVDoc }
}

function update <T extends VDoc> (params: Omit<TxUpdateVDoc<T>, '_class'>): TxUpdateVDoc<T> {
  return { ...params, _class: core.class.TxUpdateVDoc }
}

function addCollection <T extends VDoc, P extends Emb> (params: Omit<TxAddVDocCollection<T, P>, '_class'>): TxAddVDocCollection<T, P> {
  return { ...params, _class: core.class.TxAddVDocCollection }
}

function updateCollection <T extends VDoc, P extends Emb> (params: Omit<TxUpdateVDocCollection<T, P>, '_class'>): TxUpdateVDocCollection<T, P> {
  return { ...params, _class: core.class.TxUpdateVDocCollection }
}

/**
 * Hold VDocs
 */
class TestDb implements Storage {
  docs: { [key: string]: VDoc} = {}
  items: { [key: string]: Emb} = {}
  async tx (tx: Tx): Promise<void> {
    // Handle VDoc operations.
    switch (tx._class) {
      case core.class.TxCreateVDoc:
        return await this.txCreateVDoc(tx as TxCreateVDoc<VDoc>)
      case core.class.TxUpdateVDoc:
        return await this.txUpdateVDoc(tx as TxUpdateVDoc<VDoc>)
      case core.class.TxAddVDocCollection:
        return await this.txAddVDocCollection(tx as TxAddVDocCollection<VDoc, Emb>)
      case core.class.TxUpdateVDocCollection:
        return await this.txUpdateVDocCollection(tx as TxUpdateVDocCollection<VDoc, Emb>)
    }
    throw new Error('fail')
  }

  async findAll<T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>): Promise<T[]> {
    return []
  }

  async txCreateVDoc (tx: TxCreateVDoc<VDoc>): Promise<void> {
    const val: VDoc = {
      _id: tx.objectId,
      _class: tx.objectClass,
      space: tx.objectSpace,
      createdOn: tx.timestamp,
      createdBy: tx.objectUser,
      ...tx.attributes
    }
    this.docs[val._id as string] = val
  }

  async txUpdateVDoc (tx: TxUpdateVDoc<VDoc>): Promise<void> {
    const doc = this.docs[tx.objectId as string]
    for (const key of Object.keys(tx.attributes)) {
      ;(doc as any)[key] = (tx.attributes as any)[key]
    }
  }

  async txAddVDocCollection (tx: TxAddVDocCollection<VDoc, Emb>): Promise<void> {
    this.items[tx.localId ?? generateId()] = makeEmb(tx.itemClass, tx.attributes)
  }

  async txUpdateVDocCollection (tx: TxUpdateVDocCollection<VDoc, Emb>): Promise<void> {
    const item = this.items[tx.localId]
    for (const key of Object.keys(tx.attributes)) {
      ;(item as any)[key] = (tx.attributes as any)[key]
    }
  }
}

describe('hierarchy', () => {
  it('should create vdoc objects', async () => {
    const hierarchy = new Hierarchy()
    for (const tx of txes) await hierarchy.tx(tx)

    const model = new TestDb()

    await model.tx(create({
      domain: hierarchy.getDomain(taskIds.class.Task),
      _id: generateId(),
      timestamp: Date.now(),
      objectClass: taskIds.class.Task,
      attributes: { name: 'task1' },
      objectSpace: '' as Ref<Space>,
      objectUser: 'user_1' as Ref<Account>,
      objectId: 'task1' as Ref<Task>
    }))
    expect(Object.keys(model.docs).length).toBe(1)
  })

  it('should create vdoc objects', async () => {
    const hierarchy = new Hierarchy()
    for (const tx of txes) await hierarchy.tx(tx)

    const model = new TestDb()

    await model.tx(create({
      domain: hierarchy.getDomain(taskIds.class.Task),
      _id: generateId(),
      timestamp: Date.now(),
      objectClass: taskIds.class.Task,
      attributes: { name: 'task1' },
      objectSpace: '' as Ref<Space>,
      objectUser: 'user_1' as Ref<Account>,
      objectId: 'task1' as Ref<Task>
    }))
    await model.tx(update({
      domain: hierarchy.getDomain(taskIds.class.Task),
      _id: generateId(),
      timestamp: Date.now(),
      objectClass: taskIds.class.Task,
      objectId: 'task1' as Ref<Task>,
      attributes: { name: 'task2' },
      objectSpace: '' as Ref<Space>,
      objectUser: 'user_2' as Ref<Account>
    }))
    expect(Object.keys(model.docs).length).toBe(1)
    expect((model.docs.task1 as Task).name).toBe('task2')
  })

  it('should add collection item', async () => {
    const hierarchy = new Hierarchy()
    for (const tx of txes) await hierarchy.tx(tx)

    const model = new TestDb()

    await model.tx(create({
      domain: hierarchy.getDomain(taskIds.class.Task),
      _id: generateId(),
      timestamp: Date.now(),
      objectClass: taskIds.class.Task,
      attributes: { name: 'task1' },
      objectSpace: '' as Ref<Space>,
      objectUser: 'user_1' as Ref<Account>,
      objectId: 'task1' as Ref<Task>
    }))
    await model.tx(addCollection<Task, TaskItem>({
      domain: hierarchy.getDomain(taskIds.class.Task),
      _id: generateId(),
      timestamp: Date.now(),
      objectId: 'task1' as Ref<Task>,
      collection: 'items',
      itemClass: taskIds.class.TaskItem,
      attributes: { iname: 'task1' },
      objectSpace: '' as Ref<Space>,
      objectUser: 'user_1' as Ref<Account>,
      localId: 'item_1'
    }))

    expect(Object.keys(model.items).length).toEqual(1)
  })
  it('should update collection item', async () => {
    const hierarchy = new Hierarchy()
    for (const tx of txes) await hierarchy.tx(tx)

    const model = new TestDb()

    await model.tx(create({
      domain: hierarchy.getDomain(taskIds.class.Task),
      _id: generateId(),
      timestamp: Date.now(),
      objectClass: taskIds.class.Task,
      attributes: { name: 'task1' },
      objectSpace: '' as Ref<Space>,
      objectUser: 'user_1' as Ref<Account>,
      objectId: 'task1' as Ref<Task>
    }))
    await model.tx(addCollection<Task, TaskItem>({
      domain: hierarchy.getDomain(taskIds.class.Task),
      _id: generateId(),
      timestamp: Date.now(),
      objectId: 'task1' as Ref<Task>,
      collection: 'items',
      itemClass: taskIds.class.TaskItem,
      attributes: { iname: 'task1' },
      objectSpace: '' as Ref<Space>,
      objectUser: 'user_1' as Ref<Account>,
      localId: 'item_1'
    }))
    await model.tx(updateCollection<Task, TaskItem>({
      domain: hierarchy.getDomain(taskIds.class.Task),
      _id: generateId(),
      timestamp: Date.now(),
      objectId: 'task1' as Ref<Task>,
      collection: 'items',
      itemClass: taskIds.class.TaskItem,
      localId: 'item_1',
      attributes: { iname: 'task2' },
      objectSpace: '' as Ref<Space>,
      objectUser: 'user_1' as Ref<Account>
    }))

    expect(Object.keys(model.items).length).toEqual(1)
    expect((model.items.item_1 as TaskItem).iname).toEqual('task2')
  })

  it('just make coverage happy', async () => {
    const model = new TestDb()

    const hierarchy = new Hierarchy()
    for (const tx of txes) await hierarchy.tx(tx)

    await model.tx(create({
      domain: hierarchy.getDomain(taskIds.class.Task),
      _id: generateId(),
      timestamp: Date.now(),
      objectClass: taskIds.class.Task,
      attributes: { name: 'task1' },
      objectSpace: '' as Ref<Space>,
      objectUser: 'user_1' as Ref<Account>,
      objectId: 'task1' as Ref<Task>
    }))
    await model.tx(update({
      domain: hierarchy.getDomain(taskIds.class.Task),
      _id: generateId(),
      timestamp: Date.now(),
      objectClass: taskIds.class.Task,
      objectId: 'task1' as Ref<Task>,
      attributes: { name: 'task2' },
      objectSpace: '' as Ref<Space>,
      objectUser: 'user_2' as Ref<Account>
    }))
    await model.tx(addCollection<Task, TaskItem>({
      domain: hierarchy.getDomain(taskIds.class.Task),
      _id: generateId(),
      timestamp: Date.now(),
      objectId: 'task1' as Ref<Task>,
      collection: 'items',
      itemClass: taskIds.class.TaskItem,
      attributes: { iname: 'task1' },
      objectSpace: '' as Ref<Space>,
      objectUser: 'user_1' as Ref<Account>,
      localId: 'item_1'
    }))
    await model.tx(updateCollection<Task, TaskItem>({
      domain: hierarchy.getDomain(taskIds.class.Task),
      _id: generateId(),
      timestamp: Date.now(),
      objectId: 'task1' as Ref<Task>,
      collection: 'items',
      itemClass: taskIds.class.TaskItem,
      localId: 'item_1',
      attributes: { iname: 'task2' },
      objectSpace: '' as Ref<Space>,
      objectUser: 'user_1' as Ref<Account>
    }))
  })
})
