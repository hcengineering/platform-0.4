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
  Class,
  Client,
  createClient,
  Data,
  Doc,
  Emb,
  generateId,
  Hierarchy,
  Ref,
  Space,
  Storage,
  Tx,
  TxAddCollection,
  TxProcessor,
  TxUpdateCollection,
  TxUpdateDoc
} from '@anticrm/core'
import { describe, expect, it } from '@jest/globals'
import { MongoClient } from 'mongodb'
import { DocStorage } from '../storage'
import { TxStorage } from '../tx'
import { createTask, createTaskModel, Task, TaskComment, taskIds } from './tasks'

const txesRaw = require('@anticrm/core/src/__tests__/model.tx.json') // eslint-disable-line @typescript-eslint/no-var-requires
const txes = txesRaw as unknown as Tx[]

createTaskModel(txes)

async function updateDoc<T extends Doc> (storage: Storage, doc: T, attributes: Partial<Data<T>>): Promise<T> {
  const tx: TxUpdateDoc<T> = {
    _id: generateId(),
    _class: core.class.TxUpdateDoc,
    space: core.space.Tx,
    modifiedBy: doc.modifiedBy,
    modifiedOn: Date.now(),
    objectId: doc._id,
    objectClass: doc._class,
    objectSpace: doc.space,
    attributes
  }
  await storage.tx(tx)
  return TxProcessor.createDoc2Doc(tx) as T
}

async function addCollection<T extends Doc, P extends Emb> (
  storage: Storage,
  doc: T,
  collection: string,
  itemClass: Ref<Class<T>>,
  attributes: Omit<P, keyof Emb>,
  localId?: string
): Promise<void> {
  const tx: TxAddCollection<T, P> = {
    _id: generateId(),
    _class: core.class.TxAddCollection,
    space: core.space.Tx,
    modifiedBy: doc.modifiedBy,
    modifiedOn: Date.now(),
    objectId: doc._id,
    localId,
    itemClass,
    objectSpace: doc.space,
    attributes,
    collection
  }
  await storage.tx(tx)
}

async function updateCollection<T extends Doc, P extends Emb> (
  storage: Storage,
  doc: T,
  collection: string,
  itemClass: Ref<Class<T>>,
  localId: string,
  attributes: Partial<Omit<P, keyof Emb>>
): Promise<void> {
  const tx: TxUpdateCollection<T, P> = {
    _id: generateId(),
    _class: core.class.TxUpdateCollection,
    space: core.space.Tx,
    modifiedBy: doc.modifiedBy,
    modifiedOn: Date.now(),
    objectId: doc._id,
    localId,
    itemClass,
    objectSpace: doc.space,
    attributes,
    collection
  }
  await storage.tx(tx)
}

describe('mongo operations', () => {
  const mongodbUri: string = process.env.MONGODB_URI ?? 'mongodb://localhost:27017'
  let mongoClient!: MongoClient
  let dbId: string = generateId()
  let hierarchy = new Hierarchy()
  let docStorage: DocStorage
  let client!: Client

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

    client = await createClient(async (handler) => {
      return await Promise.resolve(docStorage)
    })
  }

  beforeEach(async () => {
    return await initDb()
  })

  it('check add', async () => {
    for (let i = 0; i < 50; i++) {
      await client.createDoc(taskIds.class.Task, '' as Ref<Space>, {
        name: `my-task-${i}`,
        description: `${i * i}`,
        rate: 20 + i
      })
    }

    const r = await client.findAll(taskIds.class.Task, {})
    expect(r.length).toEqual(50)
  })

  it('check update', async () => {
    await client.createDoc(taskIds.class.Task, '' as Ref<Space>, {
      name: 'my-task',
      description: 'some data ',
      rate: 20
    })

    const doc = (await client.findAll(taskIds.class.Task, {}))[0]

    await updateDoc(client, doc, { rate: 30 })
    const tasks = await client.findAll(taskIds.class.Task, {})
    expect(tasks.length).toEqual(1)
    expect(tasks[0].rate).toEqual(30)
  })

  it('find in test', async () => {
    await client.createDoc(taskIds.class.Task, '' as Ref<Space>, createTask('t1', 10, 'test task1'))
    const t1 = (await client.findAll(taskIds.class.Task, {}))[0]
    await createComments(client, t1)

    const result = await docStorage.findIn<Task, TaskComment>(
      { objectId: t1._id, collection: 'comments', itemClass: taskIds.class.TaskComment },
      {}
    )
    expect(result).toBeDefined()
    expect(result.length).toEqual(3)
    expect(result[0]._class).toEqual(taskIds.class.TaskComment)
  })
  it('update in test', async () => {
    await client.createDoc(taskIds.class.Task, '' as Ref<Space>, createTask('t1', 10, 'test task1'))
    const t1 = (await client.findAll(taskIds.class.Task, {}))[0]
    await createComments(client, t1)

    await updateCollection(client, t1, 'comments', taskIds.class.TaskComment, '#2', { message: '#2' })

    const result = await docStorage.findIn<Task, TaskComment>(
      { objectId: t1._id, collection: 'comments', itemClass: taskIds.class.TaskComment },
      { message: '#2' }
    )
    expect(result).toBeDefined()
    expect(result.length).toEqual(1)
    expect(result[0]._class).toEqual(taskIds.class.TaskComment)
  })
})

async function createComments (client: Client, t1: Task): Promise<void> {
  await addCollection(
    client,
    t1,
    'comments',
    taskIds.class.TaskComment,
    { author: 'vasya', date: new Date(), message: 'Some msg' },
    '#1'
  )
  await addCollection(
    client,
    t1,
    'comments',
    taskIds.class.TaskComment,
    { author: 'vasya', date: new Date(), message: 'Some msg 2' },
    '#2'
  )
  await addCollection(
    client,
    t1,
    'comments',
    taskIds.class.TaskComment,
    { author: 'petya', date: new Date(), message: 'Some more msg' },
    '#3'
  )
}
