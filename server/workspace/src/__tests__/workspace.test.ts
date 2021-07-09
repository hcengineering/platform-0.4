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
  createClient,
  createShortRef,
  Doc,
  Domain,
  DOMAIN_MODEL,
  DOMAIN_REFERENCES,
  DOMAIN_TX,
  generateId,
  Ref,
  Space,
  Tx,
  TxCreateDoc,
  TxUpdateDoc,
  withOperations
} from '@anticrm/core'
import { createClass, genMinModel } from '@anticrm/core/src/__tests__/minmodel'
import { getMongoClient, shutdown } from '@anticrm/mongo'
import { dropAllDBWithPrefix } from '@anticrm/mongo/src/__tests__/storage.test'
import { Component, component } from '@anticrm/status'
import { describe, expect, it } from '@jest/globals'
import { MongoClient } from 'mongodb'
import { Workspace } from '..'

const txes: Tx[] = genMinModel()

interface MyTask extends Doc {
  name: string
}

interface MyTx extends TxCreateDoc<Doc> {
  msg: string
}

const taskIds = component('my-task' as Component, {
  class: {
    MyTask: '' as Ref<Class<MyTask>>,
    MyRef: '' as Ref<Class<MyTask>>,
    MyTx: '' as Ref<Class<MyTx>>
  }
})

const myTx = createClass(taskIds.class.MyTx, { extends: core.class.TxCreateDoc }, DOMAIN_TX)

const createMyTaskClass = createClass(taskIds.class.MyTask, { extends: core.class.Doc }, 'mytask' as Domain)

describe('workspace', () => {
  const mongoDBUri: string = process.env.MONGODB_URI ?? 'mongodb://localhost:27017'
  let dbId: string = generateId()
  let mongoDbClient!: MongoClient

  let workspace!: Workspace

  beforeAll(async () => {
    mongoDbClient = await getMongoClient(mongoDBUri, {})
    await dropAllDBWithPrefix('ws-test-', mongoDbClient)
  })

  beforeEach(async () => {
    dbId = generateId()
  })

  afterEach(async () => {
    await mongoDbClient.db('ws-test-' + dbId).dropDatabase()
  })

  afterAll(async () => {
    await shutdown()
  })

  async function createDatabase (dbId: string, transactions: Tx[]): Promise<void> {
    const txColl = mongoDbClient.db('ws-test-' + dbId).collection(DOMAIN_TX as string)
    for (const tx of transactions) {
      await txColl.insertOne(tx)
    }
  }

  it('connect to workspace', async () => {
    // Initialize workspace
    await createDatabase(dbId, txes)
    workspace = await Workspace.create('test-' + dbId, { mongoDBUri })

    // We should be able to fill all model now.
    const resultTxs = await workspace.findAll(core.class.Tx, {})

    expect(resultTxs.length).toEqual(txes.length)
  })

  it('connect to workspace, check processing', async () => {
    // Initialize workspace
    await createDatabase(dbId, txes)
    workspace = await Workspace.create('test-' + dbId, { mongoDBUri }, async (hierarchy, storage, model) => {
      expect(model.getObject(core.class.Class)).toBeDefined()
      return []
    })

    // We should be able to fill all model now.
    const resultTxs = await workspace.findAll(core.class.Tx, {})

    expect(resultTxs.length).toEqual(txes.length)
  })

  it('reconnect to workspace', async () => {
    // Initialize workspace
    await createDatabase(dbId, txes)
    workspace = await Workspace.create('test-' + dbId, { mongoDBUri })

    // We should be able to fill all model now.
    const resultTxs = await workspace.findAll(core.class.Tx, {})
    expect(resultTxs.length).toEqual(txes.length)

    workspace = await Workspace.create('test-' + dbId, { mongoDBUri })
    expect(workspace.getHierarchy().getDomain(core.class.Class)).toEqual(DOMAIN_MODEL)

    const tx2 = await workspace.findAll(core.class.Tx, {})
    expect(tx2.length).toEqual(txes.length)
  })

  it('create custom class', async () => {
    // Initialize workspace
    await createDatabase(dbId, txes)
    workspace = await Workspace.create('test-' + dbId, { mongoDBUri })

    // Register a new class
    await workspace.tx(createMyTaskClass)

    // check where is no our classes.
    const q1 = await workspace.findAll(taskIds.class.MyTask, {})
    expect(q1.length).toEqual(0)

    // Let's create a client instance, since it has usefull functions.
    const client = withOperations(
      core.account.System,
      await createClient(async () => {
        return await Promise.resolve(workspace)
      })
    )

    await client.createDoc(taskIds.class.MyTask, 'sp1' as Ref<Space>, {
      name: 'my-task'
    })

    const q = await client.findAll(taskIds.class.MyTask, { name: 'my-task' })
    expect(q.length).toEqual(1)
  })

  it('create custom classes', async () => {
    await createDatabase(dbId, txes)
    workspace = await Workspace.create('test-' + dbId, { mongoDBUri })

    // Register a new class
    await workspace.tx(createMyTaskClass)

    // check where is no our classes.
    const q1 = await workspace.findAll(taskIds.class.MyTask, {})
    expect(q1.length).toEqual(0)

    // Let's create a client instance, since it has usefull functions.
    const client = withOperations(
      core.account.System,
      await createClient(async () => {
        return await Promise.resolve(workspace)
      })
    )

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
    workspace = await Workspace.create('test-' + dbId, { mongoDBUri })

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
    workspace = await Workspace.create('test-' + dbId, { mongoDBUri })

    // Register a new class
    await workspace.tx(createMyTaskClass)

    // check where is no our classes.
    const q1 = await workspace.findAll(taskIds.class.MyTask, {})
    expect(q1.length).toEqual(0)

    // Let's create a client instance, since it has usefull functions.
    const client = withOperations(
      core.account.System,
      await createClient(async () => {
        return await Promise.resolve(workspace)
      })
    )

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
      operations: {
        name: 'my-task2'
      }
    }
    await client.tx(upd)
    const q3 = await client.findAll(taskIds.class.MyTask, { name: 'my-task2' })
    expect(q3.length).toEqual(1)
  })

  it('check create ShortRef', async () => {
    jest.setTimeout(500000)
    await createDatabase(dbId, txes)
    workspace = await Workspace.create('test-' + dbId, { mongoDBUri })

    // Register a new class
    await workspace.tx(createMyTaskClass)
    await workspace.tx(createClass(taskIds.class.MyRef, { extends: core.class.Doc }, DOMAIN_REFERENCES))

    // Let's create a client instance, since it has usefull functions.
    const client = withOperations(
      core.account.System,
      await createClient(async () => {
        return await Promise.resolve(workspace)
      })
    )

    await client.createDoc(taskIds.class.MyTask, 'sp1' as Ref<Space>, {
      name: 'my-task'
    })

    const sp = (await workspace.findAll(taskIds.class.MyTask, {}))[0]

    const initial = (await workspace.findAll(core.class.Tx, {})).length
    const t1 = await createShortRef(workspace, '' as Ref<Account>, sp, 'TASK')
    expect(t1).toBe('TASK-1')

    expect((await workspace.findAll(core.class.Tx, {})).length - initial).toEqual(1)

    const t2 = await createShortRef(workspace, '' as Ref<Account>, sp, 'TASK')
    expect(t2).toBe('TASK-2')

    expect((await workspace.findAll(core.class.Tx, {})).length - initial).toEqual(2)

    const tx: TxCreateDoc<MyTask> = {
      _id: generateId(),
      _class: core.class.TxCreateDoc,
      space: core.space.Tx,
      modifiedBy: '' as Ref<Account>,
      modifiedOn: Date.now(),
      objectId: 'TASK-3' as Ref<MyTask>,
      objectClass: taskIds.class.MyRef,
      objectSpace: '' as Ref<Space>,
      attributes: {
        name: 'qwe'
      }
    }
    await workspace.tx(tx)

    const t4 = await createShortRef(workspace, '' as Ref<Account>, sp, 'TASK')
    expect(t4).toBe('TASK-4')

    const lastTx = await workspace.findAll(core.class.Tx, {})
    expect(lastTx.length - initial).toEqual(4)
  })
})
