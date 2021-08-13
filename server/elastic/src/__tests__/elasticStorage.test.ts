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
  Domain,
  generateId,
  Hierarchy,
  Obj,
  Ref,
  SortingOrder,
  withOperations,
  _genMinModel
} from '@anticrm/core'
import { ElasticStorage } from '../index'

const txes = _genMinModel()

describe('elastic search', () => {
  it('should query model with params', async () => {
    const hierarchy = new Hierarchy()
    for (const tx of txes) hierarchy.tx(tx)
    const connectionParams = {
      url: process.env.ELASTIC_URL ?? 'http://localhost:9200',
      username: process.env.ELASTIC_USERNAME ?? 'elastic',
      password: process.env.ELASTIC_PASSWORD ?? 'changeme'
    }
    const model = new ElasticStorage(hierarchy, 'workspace-test' + generateId(), connectionParams)
    for (const tx of txes) await model.tx(tx)
    const first = await model.findAll(core.class.Class, { _id: txes[0].objectId as Ref<Class<Doc>> })
    expect(first.length).toBe(1)
    const second = await model.findAll(core.class.Class, {
      _id: { $in: [txes[0].objectId as Ref<Class<Doc>>, txes[5].objectId as Ref<Class<Doc>>] }
    })
    expect(second.length).toBe(2)
    const third = await model.findAll(core.class.Space, { name: { $in: ['Sp1', 'Sp2'] } })
    expect(third.length).toBe(2)
    const like = await model.findAll(core.class.Space, { name: { $like: 'Sp%' } })
    expect(like.length).toBe(2)
    const result = await model.findAll(core.class.Class, { domain: 'domain' as Domain })
    expect(result.length).toBe(0)
  })

  it('limit and sorting', async () => {
    const hierarchy = new Hierarchy()
    for (const tx of txes) hierarchy.tx(tx)
    const connectionParams = {
      url: process.env.ELASTIC_URL ?? 'http://localhost:9200',
      username: process.env.ELASTIC_USERNAME ?? 'elastic',
      password: process.env.ELASTIC_PASSWORD ?? 'changeme'
    }
    const model = new ElasticStorage(hierarchy, 'workspace-test' + generateId(), connectionParams)
    for (const tx of txes) await model.tx(tx)

    const without = await model.findAll(core.class.Space, {})
    expect(without).toHaveLength(2)

    const limit = await model.findAll(core.class.Space, {}, { limit: 1 })
    expect(limit).toHaveLength(1)

    const sortAsc = await model.findAll(core.class.Space, {}, { sort: { name: SortingOrder.Ascending } })
    expect(sortAsc[0].name).toMatch('Sp1')

    const sortDesc = await model.findAll(core.class.Space, {}, { sort: { name: SortingOrder.Descending } })
    expect(sortDesc[0].name).toMatch('Sp2')
  })

  it('should update doc', async () => {
    const hierarchy = new Hierarchy()
    for (const tx of txes) hierarchy.tx(tx)
    const connectionParams = {
      url: process.env.ELASTIC_URL ?? 'http://localhost:9200',
      username: process.env.ELASTIC_USERNAME ?? 'elastic',
      password: process.env.ELASTIC_PASSWORD ?? 'changeme'
    }
    const model = new ElasticStorage(hierarchy, 'workspace-test' + generateId(), connectionParams)
    const client = withOperations(core.account.System, model)
    for (const tx of txes) await client.tx(tx)
    const updatedDoc = (await client.findAll(core.class.Space, {}))[0]
    const newName = 'space' + generateId()
    await client.updateDoc(updatedDoc._class, updatedDoc.space, updatedDoc._id, {
      name: newName,
      members: []
    })
    const result = (await client.findAll(core.class.Space, { _id: updatedDoc._id }))[0]
    expect(result.name).toEqual(newName)
    expect(result.members).toHaveLength(0)
    await client.updateDoc(updatedDoc._class, updatedDoc.space, updatedDoc._id, {
      $push: { members: 'Test' as Ref<Account> }
    })
    const push = (await client.findAll(core.class.Space, { _id: updatedDoc._id }))[0]
    expect(push.members).toHaveLength(1)
    await client.updateDoc(updatedDoc._class, updatedDoc.space, updatedDoc._id, {
      $pull: { members: 'Test' as Ref<Account> }
    })
    const pull = (await client.findAll(core.class.Space, { _id: updatedDoc._id }))[0]
    expect(pull.members).toHaveLength(0)
  })

  it('should allow delete', async () => {
    const hierarchy = new Hierarchy()
    for (const tx of txes) hierarchy.tx(tx)
    const connectionParams = {
      url: process.env.ELASTIC_URL ?? 'http://localhost:9200',
      username: process.env.ELASTIC_USERNAME ?? 'elastic',
      password: process.env.ELASTIC_PASSWORD ?? 'changeme'
    }
    const model = new ElasticStorage(hierarchy, 'workspace-test' + generateId(), connectionParams)
    for (const tx of txes) await model.tx(tx)

    const first = await model.findAll(core.class.Class, { _id: txes[0].objectId as Ref<Class<Obj>> })
    expect(first.length).toBe(1)
    const ops = withOperations(core.account.System, model)
    await ops.removeDoc(first[0]._class, first[0].space, first[0]._id)
    const afterDelete = await model.findAll(core.class.Class, { _id: txes[0].objectId as Ref<Class<Obj>> })
    expect(afterDelete.length).toBe(0)
  })
})
