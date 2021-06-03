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

import { describe, it } from '@jest/globals'
import { start } from '@anticrm/server/src/server'
import core, {
  Class,
  Doc,
  Ref,
  Tx,
  DocumentQuery,
  createHierarchy,
  TxDb,
  ModelDb,
  DOMAIN_TX
} from '@anticrm/core'
import { createClient } from '@anticrm/node-client'

import modelTx from './model.tx.json'

const txes = (modelTx as unknown) as Tx[]

describe('server', () => {
  it('client connect server', async () => {    
    const hierarchy = createHierarchy()
    for (const tx of txes) hierarchy.tx(tx)

    const transactions = new TxDb(hierarchy)
    const model = new ModelDb(hierarchy)
    for (const tx of txes) {
      transactions.tx(tx)
      model.tx(tx)
    }

    function findAll<T extends Doc> (
      _class: Ref<Class<T>>,
      query: DocumentQuery<T>
    ): Promise<T[]> {
      const domain = hierarchy.getClass(_class).domain
      if (domain === DOMAIN_TX) return transactions.findAll(_class, query)
      return model.findAll(_class, query)
    }
    const serverAt = start('localhost', 0, {
      connect: (clientId, txs) => {
        return {
          findAll: findAll,
          tx: async (tx: Tx): Promise<void> => {},
          isDerived: hierarchy.isDerived
        }
      },
      close: clientId => {},      
    })
    try {
      const addr = (await serverAt).address()
      const client = await createClient(`${addr.host}:${addr.port}`)

      const result = await client.findAll(core.class.Class, {})
      expect(result.length).toEqual(10)
    } finally {
      ;(await serverAt).shutdown()
    }
  })
})
