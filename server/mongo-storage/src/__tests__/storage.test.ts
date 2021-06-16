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
  DOMAIN_MODEL,
  Emb,
  Hierarchy,
  Ref,
  Storage,
  TxCreateDoc,
  TxUpdateCollection
} from '@anticrm/core'
import { Account, Class, ClassifierKind, Data, Domain, Space } from '@anticrm/core/src/classes'
import { Tx, TxAddCollection, TxProcessor, TxUpdateDoc } from '@anticrm/core/src/tx'
import { generateId } from '@anticrm/core/src/utils'
import { Db, MongoClient } from 'mongodb'
import { TxDispatcherStorage } from '../dispatcher'
import { DocStorage } from '../storage'
import { ModelFilter } from '../domainFilter'
import { TxStorage } from '../tx'
import { createTask, Task, TaskComment, taskIds } from './tasks'
import { describe, it, expect } from '@jest/globals'

const txesRaw = require('@anticrm/core/src/__tests__/model.tx.json') // eslint-disable-line @typescript-eslint/no-var-requires
const txes = txesRaw as unknown as Tx[]

function addClass<T extends Doc> (_id: Ref<Class<T>>): void {
  const doc: TxCreateDoc<Class<T>> = {
    _id: generateId(),
    _class: core.class.TxCreateDoc,
    objectId: _id,
    objectClass: core.class.Class,
    attributes: {
      domain: 'task' as Domain,
      kind: ClassifierKind.CLASS,
      extends: core.class.Doc
    },
    modifiedBy: 'model' as Ref<Account>,
    modifiedOn: Date.now(),
    objectSpace: core.space.Model as Ref<Space>,
    space: core.space.Model as Ref<Space>
  }
  txes.push(doc)
}

addClass(taskIds.class.Task)
addClass(taskIds.class.TaskComment)
addClass(taskIds.class.TaskEstimate)

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
  let dbClient!: MongoClient
  const dbId = 'mongo-storage-tests'
  let db!: Db
  let hierarchy = new Hierarchy()
  let client: Client
  let docStorage: DocStorage

  beforeAll(async () => {
    dbClient = await MongoClient.connect(mongodbUri, { useUnifiedTopology: true })

    // Take a random database and drop all stuff if it exists.
    db = dbClient.db(dbId)
  })

  afterAll(async () => {
    // await db.dropDatabase() // Remove our generated stuff.
    await dbClient.close()
  })

  async function initDb (): Promise<void> {
    // Remove all stuff from database.
    const cls = await db.collections()
    for (const c of cls) {
      await c.drop()
    }

    hierarchy = new Hierarchy()

    const txStorage = new TxStorage(db, hierarchy)
    docStorage = new DocStorage(db, hierarchy)

    const disp = new TxDispatcherStorage(hierarchy, txStorage, new ModelFilter(DOMAIN_MODEL, hierarchy, docStorage))

    for (const t of txes) {
      try {
        await disp.tx(t)
      } catch (ex) {
        console.error(ex)
      }
    }

    client = await createClient(async (handler) => {
      return await Promise.resolve(disp)
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