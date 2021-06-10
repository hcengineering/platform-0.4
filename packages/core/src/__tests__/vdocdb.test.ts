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
import { Tx, TxAddCollection, TxCreateDoc, TxUpdateCollection, TxUpdateDoc } from '../tx'
import { generateId, makeEmb } from '../utils'
import { VDoc } from '../vdoc'

import _txes from './vdoc.tx.json'
const txes = _txes as unknown as Tx[]

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
  },
  user: 'model' as Ref<Account>,
  timestamp: Date.now()
}

txes.push(docTx)

// Helper transaction construction functions

function create <T extends VDoc> (params: Omit<TxCreateDoc<T, VDoc>, '_class'>): TxCreateDoc<T, VDoc> {
  return { ...params, _class: core.class.TxCreateDoc }
}

function update <T extends VDoc> (params: Omit<TxUpdateDoc<T, VDoc>, '_class'>): TxUpdateDoc<T, VDoc> {
  return { ...params, _class: core.class.TxUpdateDoc }
}

function addCollection <T extends VDoc, P extends Emb> (params: Omit<TxAddCollection<T, P>, '_class'>): TxAddCollection<T, P> {
  return { ...params, _class: core.class.TxAddCollection }
}

function updateCollection <T extends VDoc, P extends Emb> (params: Omit<TxUpdateCollection<T, P>, '_class'>): TxUpdateCollection<T, P> {
  return { ...params, _class: core.class.TxUpdateCollection }
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
      case core.class.TxCreateDoc:
        return await this.txCreateVDoc(tx as TxCreateDoc<VDoc, VDoc>)
      case core.class.TxUpdateDoc:
        return await this.txUpdateVDoc(tx as TxUpdateDoc<VDoc, VDoc>)
      case core.class.TxAddCollection:
        return await this.txAddVDocCollection(tx as TxAddCollection<VDoc, Emb>)
      case core.class.TxUpdateCollection:
        return await this.txUpdateVDocCollection(tx as TxUpdateCollection<VDoc, Emb>)
    }
    throw new Error('fail')
  }

  async findAll<T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>): Promise<T[]> {
    return []
  }

  async txCreateVDoc (tx: TxCreateDoc<VDoc, VDoc>): Promise<void> {
    const val: VDoc = {
      _id: tx.objectId,
      _class: tx.objectClass,
      space: tx.space ?? '-' as Ref<Space>,
      createdOn: tx.timestamp,
      createdBy: tx.user,
      ...tx.attributes
    }
    this.docs[val._id as string] = val
  }

  async txUpdateVDoc (tx: TxUpdateDoc<VDoc, VDoc>): Promise<void> {
    const doc = this.docs[tx.objectId as string]
    for (const key of Object.keys(tx.attributes)) {
      ;(doc as any)[key] = (tx.attributes as any)[key]
    }
  }

  async txAddVDocCollection (tx: TxAddCollection<VDoc, Emb>): Promise<void> {
    this.items[tx.localId ?? generateId()] = makeEmb(tx.itemClass, tx.attributes)
  }

  async txUpdateVDocCollection (tx: TxUpdateCollection<VDoc, Emb>): Promise<void> {
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
      space: '' as Ref<Space>,
      user: 'user_1' as Ref<Account>,
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
      space: '' as Ref<Space>,
      user: 'user_1' as Ref<Account>,
      objectId: 'task1' as Ref<Task>
    }))
    await model.tx(update({
      domain: hierarchy.getDomain(taskIds.class.Task),
      _id: generateId(),
      timestamp: Date.now(),
      objectClass: taskIds.class.Task,
      objectId: 'task1' as Ref<Task>,
      attributes: { name: 'task2' },
      space: '' as Ref<Space>,
      user: 'user_2' as Ref<Account>
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
      space: '' as Ref<Space>,
      user: 'user_1' as Ref<Account>,
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
      space: '' as Ref<Space>,
      user: 'user_1' as Ref<Account>,
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
      space: '' as Ref<Space>,
      user: 'user_1' as Ref<Account>,
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
      space: '' as Ref<Space>,
      user: 'user_1' as Ref<Account>,
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
      space: '' as Ref<Space>,
      user: 'user_1' as Ref<Account>
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
      space: '' as Ref<Space>,
      user: 'user_1' as Ref<Account>,
      objectId: 'task1' as Ref<Task>
    }))
    await model.tx(update({
      domain: hierarchy.getDomain(taskIds.class.Task),
      _id: generateId(),
      timestamp: Date.now(),
      objectClass: taskIds.class.Task,
      objectId: 'task1' as Ref<Task>,
      attributes: { name: 'task2' },
      space: '' as Ref<Space>,
      user: 'user_2' as Ref<Account>
    }))
    await model.tx(addCollection<Task, TaskItem>({
      domain: hierarchy.getDomain(taskIds.class.Task),
      _id: generateId(),
      timestamp: Date.now(),
      objectId: 'task1' as Ref<Task>,
      collection: 'items',
      itemClass: taskIds.class.TaskItem,
      attributes: { iname: 'task1' },
      space: '' as Ref<Space>,
      user: 'user_1' as Ref<Account>,
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
      space: '' as Ref<Space>,
      user: 'user_1' as Ref<Account>
    }))
  })
})
