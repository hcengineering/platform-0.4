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
  Member,
  Ref,
  Space,
  TxAddCollection,
  TxCreateDoc
} from '@anticrm/core'
import builder from '@anticrm/model-all'
import { createClient } from '@anticrm/node-client'
import { start } from '@anticrm/server/src/server'
import { decodeToken, generateToken } from '@anticrm/server/src/token'
import { assignWorkspace, closeWorkspace } from '@anticrm/server/src/workspaces'
import { Component, component } from '@anticrm/status'
import { shutdown, Workspace } from '@anticrm/workspace'
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

const createMyTaskSpace: TxCreateDoc<Space> = {
  _id: generateId(),
  _class: core.class.TxCreateDoc,
  objectId: 'sp1' as Ref<Space>,
  objectClass: core.class.Space,
  modifiedBy: 'model' as Ref<Account>,
  modifiedOn: Date.now(),
  objectSpace: core.space.Model,
  space: core.space.Model,
  attributes: {
    name: 'myTaskSpace',
    description: 'test Space',
    private: false
  }
}

const joinMySpace: TxAddCollection<Space, Member> = {
  objectId: createMyTaskSpace.objectId,
  objectSpace: core.space.Model,
  _id: generateId(),
  space: core.space.Tx,
  modifiedBy: 'test' as Ref<Account>,
  modifiedOn: Date.now(),
  collection: 'members',
  _class: core.class.TxAddCollection,
  itemClass: core.class.Member,
  attributes: {
    account: 'test' as Ref<Account>
  }
}

describe('workspace', () => {
  const mongoDBUri: string = process.env.MONGODB_URI ?? 'mongodb://localhost:27017'
  let dbId: string
  let workspace!: Workspace

  beforeEach(async () => {
    dbId = 'ws-test-db-' + generateId()
    workspace = await Workspace.create(dbId, { mongoDBUri })
    await workspace.initialize(txes)
  })
  afterEach(async () => {
    await workspace.cleanup()
  })
  afterAll(async () => {
    await shutdown()
  })

  it('connect to workspace', async () => {
    // Initialize workspace
    // eslint-disable-next-line
    const serverAt = await start('localhost', 0, {
      connect: async (clientId, token) => {
        try {
          const { accountId, workspaceId } = decodeToken(TEST_SECRET, token)
          return await assignWorkspace({ clientId, accountId, workspaceId, tx: (tx) => {} })
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

      // create space and join
      await client.tx(createMyTaskSpace)
      await client.tx(joinMySpace)

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
