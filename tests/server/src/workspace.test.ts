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
  Doc,
  Domain,
  generateId,
  Ref,
  Space,
  TxCreateDoc,
  withOperations
} from '@anticrm/core'
import { createClient } from '@anticrm/node-client'
import { start } from '@anticrm/server/src/server'
import { decodeToken, generateToken } from '@anticrm/server/src/token'
import { assignWorkspace, closeWorkspace } from '@anticrm/server/src/workspaces'
import { Component, component } from '@anticrm/status'
import { createWorkspace, deleteWorkspace, shutdown } from '@anticrm/workspaces'
import { describe, expect, it } from '@jest/globals'

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
  createOn: Date.now(),
  modifiedOn: Date.now(),
  objectSpace: core.space.Model,
  space: core.space.Model
}

const createMyTaskSpace: TxCreateDoc<Space> = {
  _id: generateId(),
  _class: core.class.TxCreateDoc,
  objectId: 'sp1' as Ref<Space>,
  objectClass: core.class.Space,
  modifiedBy: 'model' as Ref<Account>,
  createOn: Date.now(),
  modifiedOn: Date.now(),
  objectSpace: core.space.Model,
  space: core.space.Model,
  attributes: {
    name: 'myTaskSpace',
    description: 'test Space',
    private: false,
    members: ['test' as Ref<Account>]
  }
}

describe('workspace', () => {
  const mongoDBUri: string = process.env.MONGODB_URI ?? 'mongodb://localhost:27017'
  let dbId: string

  beforeEach(async () => {
    dbId = 'test-' + generateId()
    return await createWorkspace(dbId, { mongoDBUri })
  })

  afterEach(async () => {
    return await deleteWorkspace(dbId, { mongoDBUri })
  })

  afterAll(async () => {
    return await shutdown()
  })

  it('connect to workspace', async () => {
    console.log('start connecting')
    // Initialize workspace
    const serverAt = await start('localhost', 0, {
      connect: async (clientId, token) => {
        console.log('server accepted client')
        try {
          const { accountId, workspaceId } = decodeToken(TEST_SECRET, token)
          const storage = await assignWorkspace({ clientId, accountId, workspaceId, tx: (tx) => {} })
          console.log('workspace assigned')
          return {
            findAll: async (_class, query) => {
              // console.log('findAll', _class, query)
              const result = await storage.findAll(_class, query)
              // console.log('findAll result', result)
              return result
            },
            tx: async (tx) => {
              // console.log('tx', tx)
              await storage.tx(tx)
            },
            accountId: async () => {
              await Promise.resolve(core.account.System)
            }
          }
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
      const client = withOperations(
        core.account.System,
        await createClient(`${addr.address}:${addr.port}/${generateToken(TEST_SECRET, 'test', dbId)}`)
      )

      console.log('client connected')

      // We should be able to fill all model now.
      const resultTxs = await client.findAll(core.class.Tx, {})

      expect(resultTxs.length).toBeGreaterThan(0)

      // Check we could create some real objects
      // Register a new class

      await client.tx(createMyTaskClass)

      // create space and join
      await client.tx(createMyTaskSpace)

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
