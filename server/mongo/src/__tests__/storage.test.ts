/* eslint-disable @typescript-eslint/no-non-null-assertion */
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
  Client,
  createClient,
  Doc,
  DocumentUpdate,
  generateId,
  Hierarchy,
  Ref,
  Space,
  Storage,
  TxOperations,
  TxUpdateDoc,
  withOperations
} from '@anticrm/core'
import { genMinModel } from '@anticrm/core/src/__tests__/minmodel'
import { describe, expect, it } from '@jest/globals'
import { MongoClient } from 'mongodb'
import { DocStorage } from '../storage'
import { TxStorage } from '../tx'
import { createTask, createTaskModel, Task, taskIds } from './tasks'

const txes = genMinModel()

createTaskModel(txes)

async function updateDoc<T extends Doc> (storage: Storage, doc: T, operations: DocumentUpdate<T>): Promise<void> {
  const tx: TxUpdateDoc<T> = {
    _id: generateId(),
    _class: core.class.TxUpdateDoc,
    space: core.space.Tx,
    modifiedBy: doc.modifiedBy,
    modifiedOn: Date.now(),
    objectId: doc._id,
    objectClass: doc._class,
    objectSpace: doc.space,
    operations
  }
  await storage.tx(tx)
}

describe('mongo operations', () => {
  const mongodbUri: string = process.env.MONGODB_URI ?? 'mongodb://localhost:27017'
  let mongoClient!: MongoClient
  let dbId: string = generateId()
  let hierarchy = new Hierarchy()
  let docStorage: DocStorage
  let client!: Client & TxOperations

  beforeAll(async () => {
    mongoClient = await MongoClient.connect(mongodbUri, { useUnifiedTopology: true })
  })

  afterAll(async () => {
    await mongoClient.close()
  })

  beforeEach(async () => {
    dbId = 'mongo-testdb-' + generateId()
  })

  afterEach(async () => {
    try {
      await mongoClient.db(dbId).dropDatabase()
    } catch (eee) {}
  })

  async function initDb (): Promise<void> {
    // Remove all stuff from database.
    hierarchy = new Hierarchy()

    for (const t of txes) {
      await hierarchy.tx(t)
    }

    const db = mongoClient.db(dbId)
    const txStorage = new TxStorage(db.collection('tx'), hierarchy)

    // Put all transactions to Tx
    for (const t of txes) {
      await txStorage.tx(t)
    }

    docStorage = new DocStorage(db, hierarchy)

    client = withOperations(
      core.account.System,
      await createClient(async (handler) => {
        return await Promise.resolve(docStorage)
      })
    )
  }

  beforeEach(async () => {
    return await initDb()
  })

  it('check add', async () => {
    for (let i = 0; i < 50; i++) {
      await client.createDoc(taskIds.class.Task, '' as Ref<Space>, {
        name: `my-task-${i}`,
        description: `${i * i}`,
        rate: 20 + i,
        comments: []
      })
    }

    const r = await client.findAll<Task>(taskIds.class.Task, {})
    expect(r.length).toEqual(50)
  })

  it('check find by criteria', async () => {
    for (let i = 0; i < 50; i++) {
      await client.createDoc(taskIds.class.Task, '' as Ref<Space>, {
        name: `my-task-${i}`,
        description: `${i * i}`,
        rate: 20 + i,
        comments: []
      })
    }

    const r = await client.findAll<Task>(taskIds.class.Task, {})
    expect(r.length).toEqual(50)

    const first = await client.findAll<Task>(taskIds.class.Task, { name: 'my-task-0' })
    expect(first.length).toEqual(1)

    const second = await client.findAll<Task>(taskIds.class.Task, { name: { $like: '*0' } })
    expect(second.length).toEqual(5)

    const third = await client.findAll<Task>(taskIds.class.Task, { rate: { $in: [25, 26, 27, 28] } })
    expect(third.length).toEqual(4)
  })

  it('check update', async () => {
    await client.createDoc(taskIds.class.Task, '' as Ref<Space>, {
      name: 'my-task',
      description: 'some data ',
      rate: 20,
      comments: []
    })

    const doc = (await client.findAll<Task>(taskIds.class.Task, {}))[0]

    await updateDoc(client, doc, { rate: 30 })
    const tasks = await client.findAll<Task>(taskIds.class.Task, {})
    expect(tasks.length).toEqual(1)
    expect(tasks[0].rate).toEqual(30)
  })

  it('check remove', async () => {
    for (let i = 0; i < 10; i++) {
      await client.createDoc(taskIds.class.Task, '' as Ref<Space>, {
        name: `my-task-${i}`,
        description: `${i * i}`,
        rate: 20 + i,
        comments: []
      })
    }

    let r = await client.findAll<Task>(taskIds.class.Task, {})
    expect(r.length).toEqual(10)
    await client.removeDoc<Task>(taskIds.class.Task, '' as Ref<Space>, r[0]._id)
    r = await client.findAll<Task>(taskIds.class.Task, {})
    expect(r.length).toEqual(9)
  })

  it('update in test', async () => {
    await client.createDoc(taskIds.class.Task, '' as Ref<Space>, createTask('t1', 10, 'test task1'))
    const t1 = (await client.findAll<Task>(taskIds.class.Task, {}))[0]
    await createComments(client, t1)

    const result = await docStorage.findAll<Task>(taskIds.class.Task, { _id: t1._id })
    expect(result).toBeDefined()
    expect(result.length).toEqual(1)
    expect(result[0].comments?.length).toEqual(3)
  })
})

async function createComments (client: Client, t1: Task): Promise<void> {
  await updateDoc<Task>(client, t1, {
    $push: { comments: { id: '#1', author: 'vasya', date: new Date(), message: 'Some msg' } }
  })

  await updateDoc(client, t1, {
    $push: { comments: { id: '#2', author: 'vasya', date: new Date(), message: 'Some msg 2' } }
  })

  await updateDoc(client, t1, {
    $push: { comments: { id: '#3', author: 'petya', date: new Date(), message: 'Some more msg' } }
  })
}
