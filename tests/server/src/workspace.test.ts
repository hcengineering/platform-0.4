import core, { Account, Class, ClassifierKind, Doc, Domain, generateId, Hierarchy, Ref, Space, TxCreateDoc } from '@anticrm/core'
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
import builder from '@anticrm/model-all'
import { MongoConnection } from '@anticrm/mongo'
import { createClient } from '@anticrm/node-client'
import { start } from '@anticrm/server/src/server'
import { decodeToken, generateToken } from '@anticrm/server/src/token'
import { assignWorkspace, closeWorkspace } from '@anticrm/server/src/workspaces'
import { Component, component } from '@anticrm/status'
import { describe, expect, it } from '@jest/globals'

const txes = builder.getTxes()

// Will be used to hold security information.
const TEST_SECRET = 'test-secret'

interface MyTask extends Doc {
  name: string
}

const taskIds = component('my-task' as Component, {
  class: {
    MyTask: '' as Ref<Class<MyTask>>
  }
})

const createMyTaskClass: TxCreateDoc<Class<MyTask>> = {
  _id: generateId(),
  _class: core.class.TxCreateDoc,
  objectId: taskIds.class.MyTask,
  objectClass: core.class.Class,
  attributes: {
    domain: 'mytask' as Domain,
    kind: ClassifierKind.CLASS,
    extends: core.class.Doc
  },
  modifiedBy: 'model' as Ref<Account>,
  modifiedOn: Date.now(),
  objectSpace: core.space.Model,
  space: core.space.Model
}

describe('workspace', () => {
  const mongodbUri: string = process.env.MONGODB_URI ?? 'mongodb://localhost:27017'
  let mongoConnection!: MongoConnection
  const dbId = generateId()

  beforeAll(async () => {
    mongoConnection = new MongoConnection(mongodbUri)
  })
  afterAll(async () => {
    await mongoConnection.dropWorkspace(dbId)
    await mongoConnection.shutdown()
  })

  async function initWorkspace (): Promise<void> {
    const hierarchy = new Hierarchy()
    const txes = builder.getTxes()
    for (const t of txes) {
      await hierarchy.tx(t)
    }

    await mongoConnection.dropWorkspace(dbId)
    const txStore = await mongoConnection.createMongoTxStorage(dbId, hierarchy)
    for (const t of txes) {
      await txStore.tx(t)
    }
  }
  it('connect to workspace', async () => {
    // Initialize workspace
    await initWorkspace()
    // eslint-disable-next-line
    const serverAt = await start('localhost', 0, {
      connect: async (clientId, token, txs, close) => {
        try {
          const { accountId, workspaceId } = decodeToken(TEST_SECRET, token)
          return await assignWorkspace({ clientId, accountId, workspaceId, tx: (tx) => {}, close })
        } catch (err) {
          console.error(err)
          throw new Error('invalid token')
        }
      },
      close: async (clientId) => {
        await closeWorkspace(clientId)
      }
    })

    try {
      const addr = (await serverAt).address()
      const client = await createClient(`${addr.host}:${addr.port}/${generateToken(TEST_SECRET, 'test', dbId)}`)

      // We should be able to fill all model now.
      const resultTxs = await client.findAll(core.class.Tx, {})

      expect(resultTxs.length).toEqual(txes.length)

      // Check we could create some real objects
      // Register a new class

      await client.tx(createMyTaskClass)

      // check where is no our classes.
      const q1 = await client.findAll(taskIds.class.MyTask, {})
      expect(q1.length).toEqual(0)

      // Lets create a new instance of our documetn and check it is available after it.

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

      // Now let's create My Task object.
    } finally {
      ;(await serverAt).shutdown()
      console.log('server shutdown ok')
    }
  })
})
