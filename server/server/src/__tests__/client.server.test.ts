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
  Space,
  Title,
  Tx,
  withSID,
  _createClass as createClass,
  _createDoc as createDoc
} from '@anticrm/core'
import { Domain } from '@anticrm/core/src/classes'
import builder from '@anticrm/model-all'
import { getMongoClient, mongoEscape, shutdown, _dropAllDBWithPrefix } from '@anticrm/mongo'
import { component, Component } from '@anticrm/status'
import * as net from 'net'
import { assignWorkspace, closeWorkspace, generateToken, Server, startServer } from '..'
import { selfSignedAuth } from '../tls_utils'
import { ClientWithShutdown, createClient as createRawClient } from './client'

const SERVER_SECRET = 'secret'
const MONGO_URI = 'mongodb://localhost:27017'

const johnAccount = 'john@appleseed.com' as Ref<Account>
const brianAccount = 'brian@appleseed.com' as Ref<Account>
const securityCertificate = selfSignedAuth()

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

async function prepareServer (enableLogging = true): Promise<{
  shutdown: () => Promise<void>
  address: net.AddressInfo
  workspaceId: string
  server: Server
  waitDD: () => Promise<void>
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
    createDoc(core.class.Account, { email: brianAccount, name: 'Brian Appleseed' }, brianAccount),
    createDoc<DerivedDataDescriptor<Title, Reference>>(core.class.DerivedDataDescriptor, {
      sourceClass: core.class.Account,
      targetClass: core.class.Reference,
      rules: [
        {
          sourceField: 'email',
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
  const sidTx = withSID(undefined, -1)
  for (const tx of btx) {
    await txes.insertOne(mongoEscape(await sidTx(tx)))
  }

  const { workspace } = await assignWorkspace({
    clientId: 'system-id',
    accountId: core.account.System,
    workspaceId,
    tx: (tx) => {}
  })

  // eslint-disable-next-line
  const server = await startServer('localhost', 0, SERVER_SECRET, {
    logRequests: enableLogging,
    logTransactions: enableLogging,
    security: await securityCertificate
  })

  // We need to wait for initial DD to be processed before test is processing.

  return {
    shutdown: async () => {
      await closeWorkspace('system-id')
      server.shutdown()
    },
    address: server.address(),
    workspaceId,
    server,
    waitDD: async () => await workspace.waitDDComplete()
  }
}

describe('real-server', () => {
  let serverShutdown: () => Promise<void>
  let address: net.AddressInfo
  let server: Server
  let workspaceId: string
  let waitDD: () => Promise<void>
  const mongodbUri: string = process.env.MONGODB_URI ?? 'mongodb://localhost:27017'
  const clients: ClientWithShutdown[] = []

  async function cleanDbs (): Promise<void> {
    const mongoClient = await getMongoClient(mongodbUri)
    await _dropAllDBWithPrefix('ws-s-test', mongoClient)
  }

  async function createClient (
    clientUrl: string,
    certificate: string,
    notify?: (tx: Tx) => void
  ): Promise<ClientWithShutdown> {
    const c = await createRawClient(clientUrl, certificate, notify)
    clients.push(c)
    return c
  }

  beforeAll(async () => {
    await cleanDbs()
  })

  afterAll(async () => {
    await cleanDbs()
    await shutdown()
  })

  beforeEach(async () => {
    const s = await prepareServer()
    serverShutdown = s.shutdown
    address = s.address
    workspaceId = s.workspaceId
    server = s.server
    waitDD = s.waitDD
  })

  afterEach(async () => {
    for (const c of clients) {
      await c.shutdown()
    }
    clients.splice(0, clients.length)
    return await serverShutdown()
  })

  it('client connect server', async () => {
    const johnTxes: Tx[] = []
    const client = await createClient(
      `${address.address}:${address.port}/${generateToken(SERVER_SECRET, johnAccount as string, workspaceId, {
        email: johnAccount,
        firstName: 'John',
        lastName: 'Applesseed'
      })}`,
      (
        await securityCertificate
      ).cert,
      (tx) => {
        johnTxes.push(tx)
      }
    )

    const brainTxes: Tx[] = []
    const client2 = await createClient(
      `${address.address}:${address.port}/${generateToken(SERVER_SECRET, brianAccount as string, workspaceId, {
        email: brianAccount
      })}`,
      (
        await securityCertificate
      ).cert,
      (tx) => {
        brainTxes.push(tx)
        console.log(brainTxes.length, tx)
      }
    )

    const sp1 = await client.createDoc(core.class.Space, core.space.Model, {
      name: 'test-space',
      members: [johnAccount, brianAccount],
      description: 'test space',
      private: true
    })

    // Create account inside space, to cause DD be in same space.
    await client.createDoc(core.class.Account, sp1._id, {
      email: 't1',
      name: 't2'
    })
    await waitDD()
    expect(johnTxes.length).toBeGreaterThanOrEqual(3)
    expect(brainTxes.length).toBeGreaterThanOrEqual(3)
    const c2t = await client2.findAll(core.class.Account, {})
    expect(c2t.length).toEqual(2)

    const c2r = await client2.findAll(core.class.Reference, {})
    expect(c2r.length).toEqual(1)
  })

  it('failed client', async () => {
    const client = await createClient(
      `${address.address}:${address.port}/${generateToken(SERVER_SECRET, johnAccount as string, workspaceId, {
        email: johnAccount
      })}`,
      (
        await securityCertificate
      ).cert,
      (tx) => {}
    )
    expect(client).toBeDefined()

    // eslint-disable-next-line
    expect(
      createClient(
        `${address.address}:${address.port}/${
          'qwe' + generateToken(SERVER_SECRET, johnAccount as string, workspaceId, { email: johnAccount })
        }`,
        (await securityCertificate).cert,
        (tx) => {}
      )
    ).rejects.toThrow()
  })
  it('check comments dd', async () => {
    const johnTxes: Tx[] = []
    const client = await createClient(
      `${address.address}:${address.port}/${generateToken(SERVER_SECRET, johnAccount as string, workspaceId, {
        email: johnAccount
      })}`,
      (
        await securityCertificate
      ).cert,
      (tx) => {
        johnTxes.push(tx)
      }
    )

    const brainTxes: Tx[] = []

    const client2 = await createClient(
      `${address.address}:${address.port}/${generateToken(SERVER_SECRET, brianAccount as string, workspaceId, {
        email: johnAccount
      })}`,
      (
        await securityCertificate
      ).cert,
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
    console.log('brainTxes.length', brainTxes.length)
    await waitDD()
    const t12 = await client2.findAll(testIds.class.Task, {})
    expect(t12.length).toEqual(1)
    expect(t12[0].comments?.length).toEqual(2)
  })
  it('test tx with error', async () => {
    const client = await createClient(
      `${address.address}:${address.port}/${generateToken(SERVER_SECRET, johnAccount as string, workspaceId, {
        email: 'vasya'
      })}`,
      (
        await securityCertificate
      ).cert,
      (tx) => {}
    )
    await expect(client.tx({ _class: core.class.TxCreateDoc } as unknown as Tx<Doc>)).rejects.toThrow()
  })
  it('test find with error', async () => {
    const client = await createClient(
      `${address.address}:${address.port}/${generateToken(SERVER_SECRET, johnAccount as string, workspaceId, {
        email: 'vasya'
      })}`,
      (
        await securityCertificate
      ).cert,
      (tx) => {}
    )
    // eslint-disable-next-line
    await expect(client.findAll(core.class.ShortRef, { space: 'zzz' as Ref<Space> })).rejects.toThrow()
  })

  it('without logging', async () => {
    ;({ serverShutdown, address, workspaceId } = await restartServer(false, serverShutdown, address, workspaceId))

    try {
      const client = await createClient(
        `${address.address}:${address.port}/${generateToken(SERVER_SECRET, johnAccount as string, workspaceId, {
          email: johnAccount
        })}`,
        (
          await securityCertificate
        ).cert,
        (tx) => {}
      )
      expect(client).toBeDefined()
      console.info('try client with wrong token')

      // eslint-disable-next-line
      await expect(
        createClient(
          `${address.address}:${address.port}/${
            'qwe' + generateToken(SERVER_SECRET, johnAccount as string, workspaceId, { email: johnAccount })
          }`,
          (
            await securityCertificate
          ).cert,
          (tx) => {}
        )
      ).rejects.toThrow()
    } finally {
      ;({ serverShutdown, address, workspaceId } = await restartServer(true, serverShutdown, address, workspaceId))
    }
  })
  it('test empty token', async () => {
    await expect(
      async () => await createClient(`${address.address}:${address.port}`, (await securityCertificate).cert, (tx) => {})
    ).rejects.toThrow()
  })

  it('test client disconnect', async () => {
    const client = await createClient(
      `${address.address}:${address.port}/${generateToken(SERVER_SECRET, johnAccount as string, workspaceId, {
        email: 'vasya'
      })}`,
      (
        await securityCertificate
      ).cert,
      (tx) => {}
    )
    client.shutdown()
  })
  it('test server error', async () => {
    await createClient(
      `${address.address}:${address.port}/${generateToken(SERVER_SECRET, johnAccount as string, workspaceId, {
        email: 'vasya'
      })}`,
      (
        await securityCertificate
      ).cert,
      (tx) => {}
    )
    Array.from(server.connections.values()).forEach((socket) => {
      socket.emit('error', {
        error: 'qwe',
        message: 'qwe',
        type: 'qwe',
        target: socket
      })
    })
    expect(server.connections.size).toEqual(0)
  })
})
async function restartServer (
  logging: boolean,
  serverShutdown: () => Promise<void>,
  address: net.AddressInfo,
  workspaceId: string
): Promise<{ serverShutdown: () => Promise<void>, address: net.AddressInfo, workspaceId: string }> {
  await serverShutdown()
  const s = await prepareServer(logging)
  serverShutdown = s.shutdown
  address = s.address
  workspaceId = s.workspaceId
  return { serverShutdown, address, workspaceId }
}
