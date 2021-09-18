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

import type { Account, Class, Doc, Obj, Ref, Space } from '../classes'
import core from '../component'
import { Hierarchy } from '../hierarchy'
import { ModelDb, TxDb } from '../memdb'
import { SortingOrder } from '../storage'
import { TxUpdateDoc, withOperations } from '../tx'
import { _genMinModel } from '../minmodel'

const txes = _genMinModel()

describe('memdb', () => {
  it('should save all tx', async () => {
    const { txDb } = await prepareModel()

    const result = await txDb.findAll(core.class.Tx, {})
    expect(result.length).toBe(txes.filter((tx) => tx._class === core.class.TxCreateDoc).length)
  })

  it('should query model', async () => {
    const { model } = await prepareModel()

    const result = await model.findAll(core.class.Class, {})
    expect(result.length).toBeGreaterThan(5)
    const result2 = await model.findAll('class:workbench.Application' as Ref<Class<Doc>>, { _id: undefined })
    expect(result2).toHaveLength(0)
  })

  it('should allow delete', async () => {
    const { model } = await prepareModel()

    const result = await model.findAll(core.class.Space, {})
    expect(result.length).toBe(2)

    const ops = withOperations(core.account.System, model)
    await ops.removeDoc(result[0]._class, result[0].space, result[0]._id)
    const result2 = await model.findAll(core.class.Space, {})
    expect(result2).toHaveLength(1)
  })

  it('should query model with params', async () => {
    const { model } = await prepareModel()

    const first = await model.findAll(core.class.Class, {
      _id: txes[1].objectId as Ref<Class<Obj>>,
      kind: 0
    })
    expect(first.length).toBe(1)
    const und = await model.findAll(core.class.Class, {
      _id: txes[1].objectId as Ref<Class<Obj>>,
      kind: undefined
    })
    expect(und.length).toBe(1)
    const second = await model.findAll(core.class.Class, {
      _id: { $in: [txes[1].objectId as Ref<Class<Obj>>, txes[3].objectId as Ref<Class<Obj>>] }
    })
    expect(second.length).toBe(2)
    const incorrectId = await model.findAll(core.class.Class, {
      _id: (txes[1].objectId + 'test') as Ref<Class<Obj>>
    })
    expect(incorrectId.length).toBe(0)
    const result = await model.findAll(core.class.Class, {
      _id: txes[1].objectId as Ref<Class<Obj>>,
      kind: 1
    })
    expect(result.length).toBe(0)
    const multipleParam = await model.findAll(core.class.Doc, {
      space: { $in: [core.space.Model, core.space.Tx] }
    })
    expect(multipleParam.length).toBeGreaterThan(5)
  })

  it('should query model like params', async () => {
    const { model } = await prepareModel()

    const expectedLength = txes.filter((tx) => tx.objectSpace === core.space.Model).length
    const without = await model.findAll(core.class.Doc, {
      space: { $like: core.space.Model }
    })
    expect(without).toHaveLength(expectedLength)
    const begin = await model.findAll(core.class.Doc, {
      space: { $like: '%Model' }
    })
    expect(begin).toHaveLength(expectedLength)
    const zero = await model.findAll(core.class.Doc, {
      space: { $like: 'Model' }
    })
    expect(zero).toHaveLength(0)
    const end = await model.findAll(core.class.Doc, {
      space: { $like: 'space:core.M%' }
    })
    expect(end).toHaveLength(expectedLength)
    const mid = await model.findAll(core.class.Doc, {
      space: { $like: '%M%de%' }
    })
    expect(mid).toHaveLength(expectedLength)
    const all = await model.findAll(core.class.Doc, {
      space: { $like: '%Mod%' }
    })
    expect(all).toHaveLength(expectedLength)

    const nonSp1 = await model.findAll(core.class.Space, {
      name: { $ne: 'Sp1' }
    })
    expect(nonSp1).toHaveLength(1)

    const nonStarred = await model.findAll(core.class.Space, {
      'account.starred': { $ne: true }
    })
    expect(nonStarred).toHaveLength(2)
  })

  it('should push to array', async () => {
    const { model } = await prepareModel()

    const client = withOperations(core.account.System, model)
    const space = await client.createDoc(core.class.Space, core.space.Model, {
      name: 'name',
      description: 'desc',
      private: false,
      members: []
    })
    const account = await client.createDoc(core.class.Account, core.space.Model, {
      email: 'account@site.com',
      name: 'account'
    })
    const account2 = await client.createDoc(core.class.Account, core.space.Model, {
      email: 'account2@site.com',
      name: 'account2'
    })
    const account3 = await client.createDoc(core.class.Account, core.space.Model, {
      email: 'account3@site.com',
      name: 'account3'
    })
    await client.updateDoc(core.class.Space, core.space.Model, space._id, { $push: { members: account._id } })
    const txSpace = await client.findAll(core.class.Space, { _id: space._id })
    expect(txSpace[0].members).toEqual(expect.arrayContaining([account._id]))
    expect(txSpace[0].members).toHaveLength(1)
    await client.updateDoc(core.class.Space, core.space.Model, space._id, {
      $push: { members: { $each: [account2._id, account3._id] } }
    })
    const result = await client.findAll(core.class.Space, { _id: space._id })
    expect(result[0].members).toEqual(expect.arrayContaining([account._id, account2._id, account3._id]))
    expect(result[0].members).toHaveLength(3)
  })

  it('check $push find', async () => {
    const { model } = await prepareModel()

    interface MyDoc extends Doc {
      a: { b: number }
    }
    const doc: TxUpdateDoc<MyDoc> = {
      _id: '60f58968abd82692921c51b4' as Ref<TxUpdateDoc<MyDoc>>,
      _class: core.class.TxUpdateDoc,
      space: core.space.Tx,
      modifiedBy: 'john@appleseed.com' as Ref<Account>,
      modifiedOn: 1626704232444,
      createOn: 1626704232444,
      objectId: '60f58968abd82692921c51b1' as Ref<MyDoc>,
      objectClass: 'class:test.Task' as Ref<Class<Doc>>,
      objectSpace: '60f58968abd82692921c51af' as Ref<Space>,
      operations: {
        a: { b: 23 },
        $push: {
          collections: 'abc'
        }
      }
    }

    model.addDoc(doc)

    const d1 = await model.findAll(core.class.TxUpdateDoc, { 'operations.a.b': 23 })
    expect(d1[0]._id).toEqual('60f58968abd82692921c51b4')

    const d2 = await model.findAll(core.class.TxUpdateDoc, { 'operations.\\$push.collections': 'abc' })
    expect(d2[0]._id).toEqual('60f58968abd82692921c51b4')
  })

  it('should pull from array', async () => {
    const hierarchy = new Hierarchy()
    for (const tx of txes) await hierarchy.tx(tx)
    const model = withOperations(core.account.System, new ModelDb(hierarchy))
    for (const tx of txes) await model.tx(tx)
    const account1 = await model.createDoc(core.class.Account, core.space.Model, {
      email: 'account1@site.com',
      name: 'account1'
    })
    const account2 = await model.createDoc(core.class.Account, core.space.Model, {
      email: 'account2@site.com',
      name: 'account2'
    })
    const account3 = await model.createDoc(core.class.Account, core.space.Model, {
      email: 'account3@site.com',
      name: 'account3'
    })
    const account4 = await model.createDoc(core.class.Account, core.space.Model, {
      email: 'account4@site.com',
      name: 'account4'
    })
    const space = await model.createDoc(core.class.Space, core.space.Model, {
      name: 'name',
      description: 'desc',
      private: false,
      members: [account1._id, account2._id, account3._id, account4._id]
    })
    await model.updateDoc(core.class.Space, core.space.Model, space._id, { $pull: { members: account1._id } })
    const txSpace = await model.findAll(core.class.Space, { _id: space._id })
    expect(txSpace[0].members).toEqual(expect.arrayContaining([account2._id, account3._id, account4._id]))
    expect(txSpace[0].members).not.toEqual(expect.arrayContaining([account1._id]))
    await model.updateDoc(core.class.Space, core.space.Model, space._id, {
      $pull: { members: { $in: [account3._id, account4._id] } }
    })
    const res = await model.findAll(core.class.Space, { _id: space._id })
    expect(res[0].members).toEqual(expect.arrayContaining([account2._id]))
    expect(res[0].members).not.toEqual(expect.arrayContaining([account1._id]))
    expect(res[0].members).not.toEqual(expect.arrayContaining([account3._id]))
    expect(res[0].members).not.toEqual(expect.arrayContaining([account4._id]))
  })

  it('limit and sorting', async () => {
    const hierarchy = new Hierarchy()
    for (const tx of txes) hierarchy.tx(tx)
    const model = withOperations(core.account.System, new ModelDb(hierarchy))
    for (const tx of txes) await model.tx(tx)

    const without = await model.findAll(core.class.Space, {})
    expect(without).toHaveLength(2)

    const limit = await model.findAll(core.class.Space, {}, { limit: 1 })
    expect(limit).toHaveLength(1)

    const sortAsc = await model.findAll(core.class.Space, {}, { limit: 1, sort: { name: SortingOrder.Ascending } })
    expect(sortAsc[0].name).toMatch('Sp1')

    const sortDesc = await model.findAll(core.class.Space, {}, { limit: 1, sort: { name: SortingOrder.Descending } })
    expect(sortDesc[0].name).toMatch('Sp2')

    const numberSortDesc = await model.findAll(core.class.Doc, {}, { sort: { modifiedOn: SortingOrder.Descending } })
    expect(numberSortDesc[0].modifiedOn).toBeGreaterThanOrEqual(numberSortDesc[numberSortDesc.length - 1].modifiedOn)

    const numberSort = await model.findAll(core.class.Doc, {}, { sort: { modifiedOn: SortingOrder.Ascending } })
    expect(numberSort[0].modifiedOn).toBeLessThanOrEqual(numberSort[numberSortDesc.length - 1].modifiedOn)
  })
})
async function prepareModel (): Promise<{ model: ModelDb, hierarchy: Hierarchy, txDb: TxDb }> {
  const hierarchy = new Hierarchy()
  for (const tx of txes) {
    hierarchy.tx(tx)
  }
  const model = new ModelDb(hierarchy)
  for (const tx of txes) {
    await model.tx(tx)
  }
  const txDb = new TxDb(hierarchy)
  for (const tx of txes) await txDb.tx(tx)
  return { model, hierarchy, txDb }
}
