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

import core, { Class, Doc, DocumentQuery, DOMAIN_TX, Hierarchy, ModelDb, Ref, Tx, TxDb } from '@anticrm/core'
import { createClient } from '@anticrm/node-client'
import { start } from '@anticrm/server/src/server'
import { describe, it } from '@jest/globals'

import builder from '@anticrm/model-all'

const txes = builder.getTxes()

describe('server', () => {
  it('client connect server', async () => {
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
      query: DocumentQuery<T>
    ): Promise<T[]> {
      const domain = hierarchy.getClass(_class).domain
      if (domain === DOMAIN_TX) return await transactions.findAll(_class, query)
      return await model.findAll(_class, query)
    }

    const serverAt = start('localhost', 0, {
      connect: async () => {
        return {
          findAll,
          tx: async (tx: Tx): Promise<void> => {
          }
        }
      },
      close: async () => {}
    })
    try {
      const addr = (await serverAt).address()
      const client = await createClient(`${addr.host}:${addr.port}/t1`)

      const result = await client.findAll(core.class.Class, {})
      expect(result.length).toEqual(11)
    } finally {
      ;(await serverAt).shutdown()
    }
  })

  it('check non existing server', async () => {
    (await expect(createClient('localhost:10'))).rejects.toThrowError('Failed to connect to localhost:10: reason: connect ECONNREFUSED 127.0.0.1:10') // eslint-disable-line
  })

  it('check server connection closed', async () => {
    const hierarchy = new Hierarchy()
    for (const tx of txes) hierarchy.tx(tx)

    const transactions = new TxDb(hierarchy)
    const model = new ModelDb(hierarchy)
    for (const tx of txes) {
      await transactions.tx(tx)
      await model.tx(tx)
    }

    let req = 0
    const serverAt = start('localhost', 0, {
      connect: async (clientId, token, tx, close) => {
        return {
          // Create never complete promise. ,
          findAll: async <T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>): Promise<T[]> => {
            req++
            console.log('req', req, _class, query)
            if (req === 2) {
              console.log('close DONE')
              close(404, 'error')
              return await new Promise<T[]>(() => {
              })
            }
            const domain = hierarchy.getClass(_class).domain
            if (domain === DOMAIN_TX) return await transactions.findAll(_class, query)
            return await model.findAll(_class, query)
          },
          tx: async (tx: Tx): Promise<void> => {}
        }
      },
      close: async () => {}
    })

    try {
      const addr = (await serverAt).address()
      const client = await createClient(`${addr.host}:${addr.port}/t1`)
      await expect(client.findAll(core.class.Tx, {})).rejects.toThrowError('ERROR: status:status.UnknownError') // eslint-disable-line
    } finally {
      ;(await serverAt).shutdown()
    }
  })

  it('check server reject request', async () => {
    const hierarchy = new Hierarchy()
    for (const tx of txes) hierarchy.tx(tx)

    const transactions = new TxDb(hierarchy)
    const model = new ModelDb(hierarchy)
    for (const tx of txes) {
      await transactions.tx(tx)
      await model.tx(tx)
    }

    let req = 0
    const serverAt = start('localhost', 0, {
      connect: async (clientId, token, tx, close) => {
        return {
          // Create never complete promise. ,
          findAll: async <T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>): Promise<T[]> => {
            req++
            if (req === 2) {
              throw new Error('Some error happened')
            }
            const domain = hierarchy.getClass(_class).domain
            if (domain === DOMAIN_TX) return await transactions.findAll(_class, query)
            return await model.findAll(_class, query)
          },
          tx: async (tx: Tx): Promise<void> => {}
        }
      },
      close: async () => {}
    })

    try {
      const addr = (await serverAt).address()
      const client = await createClient(`${addr.host}:${addr.port}/t1`)
      await expect(client.findAll(core.class.Tx, {})).rejects.toThrowError('ERROR: rpc.BadRequest') // eslint-disable-line
    } finally {
      ;(await serverAt).shutdown()
    }
  })
})
