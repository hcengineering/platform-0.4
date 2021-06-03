//
// Copyright © 2021 Anticrm Platform Contributors.
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

import { LiveQuery } from '..'
import type { Class, Doc, DocumentQuery, Ref, Tx, Client, TxCreateObject, Obj } from '@anticrm/core'
import { DOMAIN_TX, Hierarchy, ModelDb, TxDb } from '@anticrm/core'

describe('query', () => {
  it('findAll', async () => {
    const txes = await getModel()
    const client = await getClient()
    const query = new LiveQuery(client)
    for (let i = 0; i < txes.length; i++) {
      const tx = txes[i]
      await query.tx(tx)
    }
    const result = await query.findAll('class:chunter.Channel' as Ref<Class<Doc>>, { private: false })
    expect(result).toHaveLength(2)
  })

  it('query with param', async () => {
    let emptyResult
    let notEmptyResult
    const queriedClass = 'class:chunter.Channel' as Ref<Class<Doc>>
    const txes = await getModel()
    const storage = await getClient()
    const query = new LiveQuery(storage)
    query.query(queriedClass, { private: true }, (result) => {
      emptyResult = result
    })
    query.query(queriedClass, { private: false }, (result) => {
      notEmptyResult = result
    })
    let expectedLength = 0
    for (let i = 0; i < txes.length; i++) {
      const tx = txes[i]
      await query.tx(tx)
      if (storage.isDerived((tx as TxCreateObject<Doc>).objectClass, queriedClass)) {
        expectedLength++
      }
      expect(emptyResult).toHaveLength(0)
      expect(notEmptyResult).toHaveLength(expectedLength)
    }
  })

  it('unsubscibe query', async () => {
    let notEmptyResult
    const queriedClass = 'class:chunter.Channel' as Ref<Class<Doc>>
    const txes = await getModel()
    const storage = await getClient()
    const query = new LiveQuery(storage)
    const unsubscribe = query.query(queriedClass, { private: false }, (result) => {
      notEmptyResult = result
    })
    let expectedLength = 0
    for (let i = 0; i < txes.length; i++) {
      const tx = txes[i]
      await query.tx(tx)
      if (storage.isDerived((tx as TxCreateObject<Doc>).objectClass, queriedClass) && expectedLength === 0) {
        expectedLength++
        unsubscribe()
      }
      expect(notEmptyResult).toHaveLength(expectedLength)
    }
  })
})

async function getModel(): Promise<Tx[]> { 
  return import('./model.tx.json') as unknown as Tx[]
}

async function getClient(): Promise<Client> {
    const hierarchy = new Hierarchy()
    const txes = await getModel()
    for (const tx of txes) hierarchy.tx(tx)
    const transactions = new TxDb(hierarchy)
    const model = new ModelDb(hierarchy)

    function findAll<T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>): Promise<T[]> {
      const domain = hierarchy.getClass(_class).domain
      if (domain === DOMAIN_TX)
        return transactions.findAll(_class, query)
      return model.findAll(_class, query)  
    }

    return { 
        findAll,
        tx: async (tx: Tx): Promise<void> => {
          await Promise.all([model.tx(tx), transactions.tx(tx)])
        },
        isDerived: <T extends Obj>(_class: Ref<Class<T>>, from: Ref<Class<T>>) => { return hierarchy.isDerived(_class, from) }
      }
  }