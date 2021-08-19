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
  DerivedDataDescriptor,
  Doc,
  DOMAIN_TX,
  FullRefString,
  generateId,
  getFullRef,
  Ref,
  Reference,
  Title,
  Tx,
  _createClass as createClass,
  _createDoc as createDoc
} from '@anticrm/core'
import { Domain } from '@anticrm/core/src/classes'
import builder from '@anticrm/model-all'
import { getMongoClient, shutdown, _dropAllDBWithPrefix } from '@anticrm/mongo'
import { component, Component } from '@anticrm/status'
import * as net from 'net'
import { generateToken } from '../token'
import { startServer } from '../wsserver'
import { createClient } from './client'

const SERVER_SECRET = 'secret'
const MONGO_URI = 'mongodb://localhost:27017'

const johnAccount = 'john@appleseed.com' as Ref<Account>
const brianAccount = 'brian@appleseed.com' as Ref<Account>

interface Task extends Doc {
  shortId: string
  title: string
  description: string
  comments?: Array<Ref<Comment>>
}

interface Comment extends Doc {
  ofDoc: FullRefString
  message: string
}

const testIds = component('test' as Component, {
  class: {
    Task: '' as Ref<Class<Task>>,
    Comment: '' as Ref<Class<Comment>>
  }
})

async function prepareServer (): Promise<{
  shutdown: () => Promise<void>
  address: net.AddressInfo
  workspaceId: string
}> {
  const client = await getMongoClient(MONGO_URI)

  const workspaceId = 's-test' + generateId()
  const db = client.db('ws-' + workspaceId)
  const collections = await db.collections()
  if (collections.length > 0) {
    throw Error('workspace already exists')
  }
  const txes = db.collection(DOMAIN_TX as string)
  const btx = [...builder.getTxes()]

  // Test ids
  btx.push(
    createClass(testIds.class.Task, { extends: core.class.Doc, domain: 'task' as Domain }),
    createClass(testIds.class.Comment, { extends: core.class.Doc, domain: 'task' as Domain }),
    createDoc(core.class.Account, { email: johnAccount, name: 'John Appleseed' }, johnAccount),
    createDoc(core.class.Account, { email: johnAccount, name: 'Brian Appleseed' }, brianAccount),
    createDoc<DerivedDataDescriptor<Title, Reference>>(core.class.DerivedDataDescriptor, {
      sourceClass: core.class.Title,
      targetClass: core.class.Reference,
      rules: [
        {
          sourceField: 'title',
          targetField: 'link'
        }
      ]
    }),
    createDoc<DerivedDataDescriptor<Comment, Task>>(core.class.DerivedDataDescriptor, {
      sourceClass: testIds.class.Comment,
      targetClass: testIds.class.Task,
      collections: [
        {
          sourceField: 'ofDoc',
          targetField: 'comments'
        }
      ]
    })
  )

  for (const tx of btx) {
    await txes.insertOne(tx)
  }

  // eslint-disable-next-line
  const server = await startServer('localhost', 0, SERVER_SECRET)
  console.log('server created')
  return {
    shutdown: async () => {
      server.shutdown()
    },
    address: server.address(),
    workspaceId
  }
}

describe('real-server', () => {
  let serverShutdown: () => Promise<void>
  let address: net.AddressInfo
  let workspaceId: string
  const mongodbUri: string = process.env.MONGODB_URI ?? 'mongodb://localhost:27017'

  async function cleanDbs (): Promise<void> {
    const mongoClient = await getMongoClient(mongodbUri)
    await _dropAllDBWithPrefix('ws-s-test', mongoClient)
  }

  beforeAll(async () => {
    await cleanDbs()
  })

  afterAll(async () => {
    await cleanDbs()
    await shutdown()
    console.log('clean after all done')
  })

  beforeEach(async () => {
    console.log('staring server')
    const s = await prepareServer()
    console.log('server ok')
    serverShutdown = s.shutdown
    address = s.address
    workspaceId = s.workspaceId
  })

  afterEach(async () => {
    return await serverShutdown()
  })

  it('client connect server', async () => {
    console.log('connecting')
    const johnTxes: Tx[] = []
    const client = await createClient(
      `${address.address}:${address.port}/${generateToken(SERVER_SECRET, johnAccount as string, workspaceId)}`,
      (tx) => {
        johnTxes.push(tx)
      }
    )

    const brainTxes: Tx[] = []
    const client2 = await createClient(
      `${address.address}:${address.port}/${generateToken(SERVER_SECRET, brianAccount as string, workspaceId)}`,
      (tx) => {
        brainTxes.push(tx)
      }
    )

    const sp1 = await client.createDoc(core.class.Space, core.space.Model, {
      name: 'test-space',
      members: [johnAccount, brianAccount],
      description: 'test space',
      private: true
    })
    expect(johnTxes.length).toEqual(1)
    expect(brainTxes.length).toEqual(1)
    await client.createDoc(core.class.Title, sp1._id, {
      title: 't1',
      objectId: 'id1' as Ref<Doc>,
      objectClass: 'c1' as Ref<Class<Doc>>,
      descriptorId: '' as Ref<DerivedDataDescriptor<Doc, Title>>
    })
    expect(johnTxes.length).toEqual(3)
    expect(brainTxes.length).toEqual(3)
    const c2t = await client2.findAll(core.class.Title, {})
    expect(c2t.length).toEqual(1)

    const c2r = await client2.findAll(core.class.Reference, {})
    expect(c2r.length).toEqual(1)
    console.info('TEST1 PASS')
  })

  it('check comments dd', async () => {
    console.log('connecting')
    const johnTxes: Tx[] = []
    const client = await createClient(
      `${address.address}:${address.port}/${generateToken(SERVER_SECRET, johnAccount as string, workspaceId)}`,
      (tx) => {
        johnTxes.push(tx)
      }
    )

    const brainTxes: Tx[] = []
    const client2 = await createClient(
      `${address.address}:${address.port}/${generateToken(SERVER_SECRET, brianAccount as string, workspaceId)}`,
      (tx) => {
        brainTxes.push(tx)
      }
    )

    const sp1 = await client.createDoc(core.class.Space, core.space.Model, {
      name: 'test-space',
      members: [johnAccount, brianAccount],
      description: 'test space',
      private: true
    })

    const t1 = await client.createDoc(testIds.class.Task, sp1._id, {
      title: 't1',
      shortId: 'id1' as Ref<Doc>,
      description: 'test'
    })

    await client.createDoc(testIds.class.Comment, sp1._id, {
      ofDoc: getFullRef(t1._id, t1._class),
      message: 'Comment'
    })
    await client.createDoc(testIds.class.Comment, sp1._id, {
      ofDoc: getFullRef(t1._id, t1._class),
      message: 'Comment 2'
    })

    const t12 = await client2.findAll(testIds.class.Task, {})
    expect(t12.length).toEqual(1)
    expect(t12[0].comments?.length).toEqual(2)
  })
})
