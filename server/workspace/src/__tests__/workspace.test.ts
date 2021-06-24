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

import core, {
  Account,
  Class,
  ClassifierKind,
  createClient,
  Data,
  Doc,
  Domain,
  DOMAIN_MODEL,
  DOMAIN_TX,
  generateId,
  Obj,
  Ref,
  Space,
  Tx,
  TxCreateDoc,
  TxUpdateDoc
} from '@anticrm/core'
import { Component, component } from '@anticrm/status'
import { describe, expect, it } from '@jest/globals'
import { Workspace } from '..'
import { shutdown, getMongoClient } from '@anticrm/mongo'
import { MongoClient } from 'mongodb'

const txes: Tx[] = []

interface MyTask extends Doc {
  name: string
}

interface MyTx extends TxCreateDoc<Doc> {
  msg: string
}

const taskIds = component('my-task' as Component, {
  class: {
    MyTask: '' as Ref<Class<MyTask>>,
    MyTx: '' as Ref<Class<MyTx>>
  }
})

function createClass<T extends Class<Obj>> (_id: Ref<T>, cl: Omit<Data<T>, 'kind'>, domain?: Domain): Tx {
  const result: TxCreateDoc<Doc> = {
    _id: generateId(),
    _class: core.class.TxCreateDoc,
    objectId: _id,
    objectClass: core.class.Class,
    attributes: {
      kind: ClassifierKind.CLASS,
      domain: domain ?? DOMAIN_MODEL,
      ...cl
    },
    modifiedBy: 'model' as Ref<Account>,
    modifiedOn: Date.now(),
    objectSpace: core.space.Model,
    space: core.space.Model
  }
  return result
}

// Fill Tx'es with basic model classes.
txes.push(createClass(core.class.Obj, {}))
txes.push(createClass(core.class.Doc, { extends: core.class.Obj }))
txes.push(createClass(core.class.Class, { extends: core.class.Doc }))
txes.push(createClass(core.class.Space, { extends: core.class.Doc }))

txes.push(createClass(core.class.Tx, { extends: core.class.Doc }, DOMAIN_TX))
txes.push(createClass(core.class.TxCreateDoc, { extends: core.class.Tx }, DOMAIN_TX))
txes.push(createClass(core.class.TxUpdateDoc, { extends: core.class.Tx }, DOMAIN_TX))

const myTx = createClass(taskIds.class.MyTx, { extends: core.class.TxCreateDoc }, DOMAIN_TX)

const createMyTaskClass = createClass(taskIds.class.MyTask, { extends: core.class.Doc }, 'mytask' as Domain)

describe('workspace', () => {
  const mongoDBUri: string = process.env.MONGODB_URI ?? 'mongodb://localhost:27017'
  let dbId: string = generateId()
  let mongoDbClient!: MongoClient

  let workspace!: Workspace

  beforeEach(async () => {
    dbId = generateId()
    mongoDbClient = await getMongoClient(mongoDBUri, {})
  })

  afterEach(async () => {
    await mongoDbClient.db('ws-' + dbId).dropDatabase()
  })

  afterAll(async () => {
    await shutdown()
  })

  async function createDatabase (dbId: string, transactions: Tx[]): Promise<void> {
    const txColl = mongoDbClient.db('ws-' + dbId).collection(DOMAIN_TX as string)
    for (const tx of transactions) {
      await txColl.insertOne(tx)
    }
  }

  it('connect to workspace', async () => {
    // Initialize workspace
    await createDatabase(dbId, txes)
    workspace = await Workspace.create(dbId, { mongoDBUri })

    // We should be able to fill all model now.
    const resultTxs = await workspace.findAll(core.class.Tx, {})

    expect(resultTxs.length).toEqual(txes.length)
  })

  it('reconnect to workspace', async () => {
    // Initialize workspace
    await createDatabase(dbId, txes)
    workspace = await Workspace.create(dbId, { mongoDBUri })

    // We should be able to fill all model now.
    const resultTxs = await workspace.findAll(core.class.Tx, {})
    expect(resultTxs.length).toEqual(txes.length)

    workspace = await Workspace.create(dbId, { mongoDBUri })
    expect(workspace.getHierarchy().getDomain(core.class.Class)).toEqual(DOMAIN_MODEL)

    const tx2 = await workspace.findAll(core.class.Tx, {})
    expect(tx2.length).toEqual(txes.length)
  })

  it('create custom class', async () => {
    // Initialize workspace
    await createDatabase(dbId, txes)
    workspace = await Workspace.create(dbId, { mongoDBUri })

    // Register a new class
    await workspace.tx(createMyTaskClass)

    // check where is no our classes.
    const q1 = await workspace.findAll(taskIds.class.MyTask, {})
    expect(q1.length).toEqual(0)

    // Let's create a client instance, since it has usefull functions.
    const client = await createClient(async () => {
      return await Promise.resolve(workspace)
    })

    await client.createDoc(taskIds.class.MyTask, 'sp1' as Ref<Space>, {
      name: 'my-task'
    })

    const q = await client.findAll(taskIds.class.MyTask, { name: 'my-task' })
    expect(q.length).toEqual(1)
  })

  it('create custom classes', async () => {
    await createDatabase(dbId, txes)
    workspace = await Workspace.create(dbId, { mongoDBUri })

    // Register a new class
    await workspace.tx(createMyTaskClass)

    // check where is no our classes.
    const q1 = await workspace.findAll(taskIds.class.MyTask, {})
    expect(q1.length).toEqual(0)

    // Let's create a client instance, since it has usefull functions.
    const client = await createClient(async () => {
      return await Promise.resolve(workspace)
    })

    await client.createDoc(taskIds.class.MyTask, 'sp1' as Ref<Space>, {
      name: 'my-task'
    })
    await client.createDoc(taskIds.class.MyTask, 'sp1' as Ref<Space>, {
      name: 'my-task2'
    })

    const q2 = await client.findAll(taskIds.class.MyTask, {})
    expect(q2.length).toEqual(2)

    const q3 = await client.findAll(taskIds.class.MyTask, { name: 'my-task' })
    expect(q3.length).toEqual(1)
  })

  it('create custom tx', async () => {
    await createDatabase(dbId, txes)
    workspace = await Workspace.create(dbId, { mongoDBUri })

    // Register a new class
    await workspace.tx(myTx)

    // Let's create a client instance, since it has usefull functions.
    const client = await createClient(async () => {
      return await Promise.resolve(workspace)
    })

    const mytxOp: MyTx = {
      _id: generateId(),
      modifiedBy: 'my-task' as Ref<Account>,
      modifiedOn: Date.now(),
      objectId: generateId(),
      _class: taskIds.class.MyTx,
      msg: 'hello',
      objectSpace: core.space.Tx,
      space: core.space.Tx,
      objectClass: taskIds.class.MyTx,
      attributes: {}
    }
    await client.tx(mytxOp)

    const q2 = await client.findAll(taskIds.class.MyTx, {})
    expect(q2.length).toEqual(1)
  })

  it('check update document', async () => {
    await createDatabase(dbId, txes)
    workspace = await Workspace.create(dbId, { mongoDBUri })

    // Register a new class
    await workspace.tx(createMyTaskClass)

    // check where is no our classes.
    const q1 = await workspace.findAll(taskIds.class.MyTask, {})
    expect(q1.length).toEqual(0)

    // Let's create a client instance, since it has usefull functions.
    const client = await createClient(async () => {
      return await Promise.resolve(workspace)
    })

    const d1 = await client.createDoc(taskIds.class.MyTask, 'sp1' as Ref<Space>, {
      name: 'my-task'
    })

    const q2 = await client.findAll(taskIds.class.MyTask, { name: 'my-task2' })
    expect(q2.length).toEqual(0)

    const upd: TxUpdateDoc<MyTask> = {
      _id: generateId(),
      modifiedBy: 'my-task' as Ref<Account>,
      modifiedOn: Date.now(),
      objectId: d1._id,
      _class: core.class.TxUpdateDoc,
      objectSpace: d1.space,
      space: core.space.Tx,
      objectClass: d1._class,
      attributes: {
        name: 'my-task2'
      }
    }
    await client.tx(upd)
    const q3 = await client.findAll(taskIds.class.MyTask, { name: 'my-task2' })
    expect(q3.length).toEqual(1)
  })
})
