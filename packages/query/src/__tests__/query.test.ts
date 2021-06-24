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
import type { Class, Doc, DocumentQuery, Ref, Tx, Client, TxCreateDoc, Obj, Space } from '@anticrm/core'
import { DOMAIN_TX, Hierarchy, ModelDb, TxDb, TxOperations, createClient, withOperations } from '@anticrm/core'
import { connect } from './connection'

import core from '@anticrm/core'

describe('query', () => {

  it('findAll', async () => {
    const client = await getClient()
    const query = withOperations(core.account.System, new LiveQuery(client))
    const result = await query.findAll<Space>('class:chunter.Channel' as Ref<Class<Doc>>, {})
    expect(result).toHaveLength(2)
  })

  it('query with param', async (done) => {
    const queriedClass = 'class:chunter.Channel' as Ref<Class<Doc>>
    const storage = await getClient()

    let expectedLength = 0
    const txes = await getModel()
    for (let i = 0; i < txes.length; i++) {
      if (storage.isDerived((txes[i] as TxCreateDoc<Doc>).objectClass, queriedClass)) {
        expectedLength++
      }
    }

    const query = new LiveQuery(storage)
    query.query<Space>(queriedClass, { private: false }, (result) => {
      expect(result).toHaveLength(expectedLength)
      done()
    })
  })

  it('query should be live', async (done) => {
    const klass = 'class:chunter.Channel' as Ref<Class<Doc>>
    const storage = await getClient()

    let expectedLength = 0
    const txes = await getModel()
    for (let i = 0; i < txes.length; i++) {
      if (storage.isDerived((txes[i] as TxCreateDoc<Doc>).objectClass, klass)) {
        expectedLength++
      }
    }

    let attempt = 0
    const query = withOperations(core.account.System, new LiveQuery(storage))
    query.query<Space>(klass, { private: false }, async (result) => {
      expect(result).toHaveLength(expectedLength + attempt)
      if (attempt > 0) {
        expect((result[expectedLength + attempt - 1] as any).x).toBe(attempt)
      }
      if (attempt++ === 3) {
        // check underlying storage received all data.
        const result = await storage.findAll<Space>(klass, { private: false })
        expect(result).toHaveLength(expectedLength + attempt - 1)
        done()
      }
    })

    await query.createDoc(klass, core.space.Model, { x: 1, private: false })
    await query.createDoc(klass, core.space.Model, { x: 2, private: false })
    await query.createDoc(klass, core.space.Model, { x: 3, private: false })
  })

  it('unsubscribe query', async () => {
    const klass = 'class:chunter.Channel' as Ref<Class<Doc>>
    const storage = await getClient()

    let expectedLength = 0
    const txes = await getModel()
    for (let i = 0; i < txes.length; i++) {
      if (storage.isDerived((txes[i] as TxCreateDoc<Doc>).objectClass, klass)) {
        expectedLength++
      }
    }

    const query = withOperations(core.account.System, new LiveQuery(storage))
    const unsubscribe = query.query<Space>(klass, { private: false }, (result) => {
      expect(result).toHaveLength(expectedLength)
    })

    unsubscribe()

    await query.createDoc(klass, core.space.Model, { private: false })
    await query.createDoc(klass, core.space.Model, { private: false })
    await query.createDoc(klass, core.space.Model, { private: false })
  })

  it('query against core client', async (done) => {
    const klass = 'class:chunter.Channel' as Ref<Class<Doc>>
    const client = await createClient(connect)

    const expectedLength = 2
    let attempt = 0
    const query = withOperations(core.account.System, new LiveQuery(client))
    query.query<Space>(klass, { private: false }, (result) => {
      expect(result).toHaveLength(expectedLength + attempt)
      if (attempt > 0) {
        expect((result[expectedLength + attempt - 1] as any).x).toBe(attempt)
      }
      if (attempt++ === 1) done()
    })

    await query.createDoc(klass, core.space.Model, { x: 1, private: false })
    await query.createDoc(klass, core.space.Model, { x: 2, private: false })
    await query.createDoc(klass, core.space.Model, { x: 3, private: false })
  })


})

async function getModel(): Promise<Tx[]> { 
  return import('./model.tx.json') as unknown as Tx[]
}

class ClientImpl implements Client {

  constructor (
    private readonly hierarchy: Hierarchy,
    private readonly model: ModelDb, 
    private readonly transactions: TxDb) {
  }
  
  async tx (tx: Tx): Promise<void> {
    await Promise.all([this.model.tx(tx), this.transactions.tx(tx)])
  }

  isDerived <T extends Obj>(_class: Ref<Class<T>>, from: Ref<Class<T>>) { 
    return this.hierarchy.isDerived(_class, from) 
  }

  findAll<T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>): Promise<T[]> {
    const domain = this.hierarchy.getClass(_class).domain
    if (domain === DOMAIN_TX)
      return this.transactions.findAll(_class, query)
    return this.model.findAll(_class, query)  
  }

}

async function getClient(): Promise<Client> {
  const hierarchy = new Hierarchy()
  const transactions = new TxDb(hierarchy)
  const model = new ModelDb(hierarchy)
  const txes = await getModel()
  for (const tx of txes) hierarchy.tx(tx)
  for (const tx of txes) model.tx(tx)
  return new ClientImpl(hierarchy, model, transactions)
}