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

import { createLiveQuery } from '..'
import core, { Class, Doc, DocumentQuery, Domain, DOMAIN_TX, Ref, Tx, Storage, createMemDb, createHierarchy, TxCreateObject } from '@anticrm/core'

describe('query', () => {
  it('query with param', async () => {
    let emptyResult
    let notEmptyResult
    const txes = await getModel()
    const storage = await getStorage(() => {})
    const query = createLiveQuery(storage)
    query.query('class:chunter.Channel' as Ref<Class<Doc>>, { private: true }, (result) => {
      emptyResult = result
    })
    query.query('class:chunter.Channel' as Ref<Class<Doc>>, { private: false }, (result) => {
      notEmptyResult = result
    })
    let expectedLength = 0
    for (let i = 0; i < txes.length; i++) {
      const tx = txes[i]
      await query.tx(tx)
      if ((tx as TxCreateObject<Doc>).objectClass === 'class:chunter.Channel') {
        expectedLength++
      }
      expect(emptyResult).toHaveLength(0)
      expect(notEmptyResult).toHaveLength(expectedLength)
    }
  })

  it('unsubscibe query', async () => {
    let notEmptyResult
    const txes = await getModel()
    const storage = await getStorage(() => {})
    const query = createLiveQuery(storage)
    const unsubscribe = query.query('class:chunter.Channel' as Ref<Class<Doc>>, { }, (result) => {
      notEmptyResult = result
    })
    let expectedLength = 0
    for (let i = 0; i < txes.length; i++) {
      const tx = txes[i]
      await query.tx(tx)
      if ((tx as TxCreateObject<Doc>).objectClass === 'class:chunter.Channel' && expectedLength === 0) {
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

async function getStorage(handler: (tx: Tx) => void): Promise<Storage> {
    const hierarchy = createHierarchy()
    const txes = await getModel()
    for (const tx of txes) hierarchy.tx(tx)
    const transactions = createMemDb(hierarchy, true)
    const model = createMemDb(hierarchy)

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
          handler(tx)
        }
      }
  }