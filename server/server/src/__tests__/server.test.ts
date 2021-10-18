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
  Doc,
  DocumentQuery,
  DOMAIN_TX,
  FindOptions,
  FindResult,
  generateId,
  Hierarchy,
  ModelDb,
  Ref,
  Tx,
  TxCreateDoc,
  TxDb
} from '@anticrm/core'
import builder from '@anticrm/model-all'
import { convertAddress, parseAddress, start } from '../server'
import { selfSignedAuth } from '../tls_utils'
import { createClient } from './client'

const txes = builder.getTxes()

const securityCertificate = selfSignedAuth()

async function prepareInMemServer (): Promise<{
  hierarchy: Hierarchy
  findAll: <T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>) => Promise<FindResult<T>>
  transactions: TxDb
  model: ModelDb
}> {
  const hierarchy = new Hierarchy()
  for (const tx of txes) hierarchy.tx(tx)

  const transactions = new TxDb(hierarchy)
  const model = new ModelDb(hierarchy)
  for (const tx of txes) {
    await transactions.tx(tx)
    await model.tx(tx)
  }

  async function findAll<T extends Doc> (
    _class: Ref<Class<T>>,
    query: DocumentQuery<T>,
    options?: FindOptions<T>
  ): Promise<FindResult<T>> {
    const domain = hierarchy.getClass(_class).domain
    if (domain === DOMAIN_TX) return await transactions.findAll(_class, query, options)
    return await model.findAll(_class, query, options)
  }
  return { hierarchy, findAll, transactions, model }
}

describe('server', () => {
  it('client connect server', async () => {
    const { findAll } = await prepareInMemServer()
    const serverAt = start(
      'localhost',
      0,
      {
        connect: async () => {
          return {
            findAll,
            tx: async (tx: Tx): Promise<void> => {},
            accountId: async () => await Promise.resolve(core.account.System)
          }
        },
        close: async () => {}
      },
      await securityCertificate
    )
    try {
      const addr = (await serverAt).address()
      const client = await createClient(`${addr.address}:${addr.port}/t1`, (await securityCertificate).cert)

      const result = await client.findAll(core.class.Class, {})
      expect(result.length).toBeGreaterThan(1)
    } finally {
      ;(await serverAt).shutdown()
    }
  })

  it('check non existing server', async () => {
    // eslint-disable-next-line
    ;(await expect(createClient('localhost:10', (await securityCertificate).cert))).rejects.toThrowError(
      'Failed to connect to localhost:10: reason: connect ECONNREFUSED 127.0.0.1:10'
    )
  })

  it('check parseAddess', () => {
    expect(parseAddress('localhost:300')).toEqual({ family: 'IPv4', address: 'localhost', port: 300 })
    expect(() => parseAddress('123qwe')).toThrow()
  })

  it('check convert address', () => {
    expect(convertAddress('localhost:300', 'localhost', 5000)).toEqual({
      family: 'IPv4',
      address: 'localhost',
      port: 300
    })
    expect(convertAddress(null, 'localhost', 5000)).toEqual({ family: 'IPv4', address: 'localhost', port: 5000 })
  })

  it('check server connection closed', async () => {
    const { hierarchy, model, transactions } = await prepareInMemServer()

    let req = 0
    const serverAt = start(
      'localhost',
      0,
      {
        connect: async (clientId, token, tx, close) => {
          return {
            // Create never complete promise. ,
            findAll: async <T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>): Promise<FindResult<T>> => {
              req++
              if (req === 2) {
                close()
                return await new Promise<FindResult<T>>(() => {})
              }
              const domain = hierarchy.getClass(_class).domain
              if (domain === DOMAIN_TX) return await transactions.findAll(_class, query)
              return await model.findAll(_class, query)
            },
            tx: async (tx: Tx): Promise<void> => {},
            accountId: async () => await Promise.resolve(core.account.System)
          }
        },
        close: async () => {}
      },
      await securityCertificate
    )

    try {
      const addr = (await serverAt).address()
      const client = await createClient(`${addr.address}:${addr.port}/t1`, (await securityCertificate).cert)
      await expect(client.findAll(core.class.Tx, {})).rejects.toThrowError('ERROR: status:status.UnknownError') // eslint-disable-line
    } finally {
      ;(await serverAt).shutdown()
    }
  })

  it('check server reject request', async () => {
    const { hierarchy, model, transactions } = await prepareInMemServer()

    let req = 0
    const serverAt = start(
      'localhost',
      0,
      {
        connect: async (clientId, token, tx, close) => {
          return {
            // Create never complete promise. ,
            findAll: async <T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>): Promise<FindResult<T>> => {
              req++
              if (req === 2) {
                throw new Error('Some error happened')
              }
              const domain = hierarchy.getClass(_class).domain
              if (domain === DOMAIN_TX) return await transactions.findAll(_class, query)
              return await model.findAll(_class, query)
            },
            tx: async (tx: Tx): Promise<void> => {},
            accountId: async () => await Promise.resolve(core.account.System)
          }
        },
        close: async () => {}
      },
      await securityCertificate
    )

    try {
      const addr = (await serverAt).address()
      const client = await createClient(`${addr.address}:${addr.port}/t1`, (await securityCertificate).cert)
      await expect(client.findAll(core.class.Tx, {})).rejects.toThrowError('ERROR: rpc.BadRequest') // eslint-disable-line
    } finally {
      ;(await serverAt).shutdown()
    }
  })

  it('server send transaction', async () => {
    const { findAll } = await prepareInMemServer()
    const transactions: Tx[] = []
    let sendTx!: (tx: Tx) => void
    const serverAt = start(
      'localhost',
      0,
      {
        connect: async (clientId, token, clientSendTx) => {
          sendTx = clientSendTx
          return {
            findAll,
            tx: async (tx: Tx): Promise<void> => {},
            accountId: async () => await Promise.resolve(core.account.System)
          }
        },
        close: async () => {}
      },
      await securityCertificate
    )
    try {
      const addr = (await serverAt).address()
      const tx: TxCreateDoc<Doc> = {
        sid: 0,
        _id: generateId(),
        _class: core.class.TxCreateDoc,
        space: core.space.Tx,
        modifiedBy: 'user' as Ref<Account>,
        createOn: Date.now(),
        modifiedOn: Date.now(),
        objectId: generateId(),
        objectClass: core.class.Doc,
        objectSpace: core.space.Model,
        attributes: {}
      }
      const cert = (await securityCertificate).cert
      await new Promise((resolve) => {
        createClient(`${addr.address}:${addr.port}/t1`, cert, (tx) => {
          transactions.push(tx)
          resolve(null)
        })
          .then((c) => {
            sendTx(tx)
          })
          .catch((err) => {
            console.error(err)
          })
      })
    } finally {
      ;(await serverAt).shutdown()
    }
  })
})
