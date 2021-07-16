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

import core, { Account, DOMAIN_TX, generateId, Ref, Tx, DerivedDataDescriptor, Doc, Class, Title } from '@anticrm/core'
import builder from '@anticrm/model-all'
import { describe, it } from '@jest/globals'
import { getMongoClient } from '@anticrm/mongo'
import { start } from '../server'
import { decodeToken, generateToken } from '../token'
import { assignWorkspace, closeWorkspace } from '../workspaces'
import { createClient } from './client'
import * as net from 'net'
import { createDoc } from '@anticrm/core/src/__tests__/minmodel'
import { Reference } from '../../../../packages/core/lib/reference'

const SERVER_SECRET = 'secret'
const MONGO_URI = 'mongodb://localhost:27017'

const johnAccount = 'john@appleseed.com' as Ref<Account>
const brianAccount = 'brian@appleseed.com' as Ref<Account>

async function prepareServer (): Promise<{ shutdown: () => Promise<void>, address: net.AddressInfo }> {
  const client = await getMongoClient(MONGO_URI)

  const workspaceId = 's-test' + generateId()
  const db = client.db('ws-' + workspaceId)
  const collections = await db.collections()
  if (collections.length > 0) {
    throw Error('workspace already exists')
  }
  const txes = db.collection(DOMAIN_TX as string)
  const btx = builder.getTxes()

  btx.push(createDoc(core.class.Account, {}, johnAccount))
  btx.push(createDoc(core.class.Account, {}, brianAccount))

  btx.push(
    createDoc<DerivedDataDescriptor<Title, Reference>>(core.class.DerivedDataDescriptor, {
      sourceClass: core.class.Title,
      targetClass: core.class.Reference,
      rules: [
        {
          sourceField: 'title',
          targetField: 'link'
        }
      ]
    })
  )

  for (const tx of btx) {
    await txes.insertOne(tx)
  }

  // eslint-disable-next-line
  const server = await start('localhost', 0, {
    connect: async (clientId, token, sendTx, close) => {
      try {
        const { accountId } = decodeToken(SERVER_SECRET, token)
        console.log(`Connected Client ${clientId} with account: ${accountId} to ${workspaceId} `)
        return await assignWorkspace({ clientId, accountId, workspaceId, tx: sendTx })
      } catch (err) {
        throw new Error('invalid token')
      }
    },
    close: async (clientId) => {
      await closeWorkspace(clientId)
    }
  })
  console.log('server created')
  return {
    shutdown: async () => {
      server.shutdown()
      console.log('dropping db')
      await db.dropDatabase()
      await client.close(true)
    },
    address: server.address()
  }
}

describe('real=server', () => {
  let shutdown: () => Promise<void>
  let address: net.AddressInfo

  beforeEach(async () => {
    console.log('staring server')
    const s = await prepareServer()
    console.log('server ok')
    shutdown = s.shutdown
    address = s.address
  })

  afterEach(async () => {
    return await shutdown()
  })

  it('client connect server', async () => {
    console.log('connecting')
    const johnTxes: Tx[] = []
    const client = await createClient(
      `${address.address}:${address.port}/${generateToken(SERVER_SECRET, johnAccount as string, '')}`,
      (tx) => {
        johnTxes.push(tx)
      }
    )

    const brainTxes: Tx[] = []
    const client2 = await createClient(
      `${address.address}:${address.port}/${generateToken(SERVER_SECRET, brianAccount as string, '')}`,
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
  })
})
