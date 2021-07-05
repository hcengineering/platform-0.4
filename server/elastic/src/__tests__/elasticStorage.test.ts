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

import { genMinModel } from '@anticrm/core/src/__tests__/minmodel'
import core, { Hierarchy, Domain, Ref, Class, Doc, Obj, withOperations } from '@anticrm/core'
import { ElasticStorage } from '../index'

const txes = genMinModel()

describe('elastic search', () => {
  it('should query model with params', async () => {
    const hierarchy = new Hierarchy()
    for (const tx of txes) hierarchy.tx(tx)
    const connectionParams = {
      url: process.env.ELASTIC_URL ?? 'http://localhost:9200',
      username: process.env.ELASTIC_USERNAME ?? 'elastic',
      password: process.env.ELASTIC_PASSWORD ?? 'changeme'
    }
    const model = new ElasticStorage(hierarchy, 'workspace', connectionParams)
    for (const tx of txes) await model.tx(tx)
    const first = await model.findAll(core.class.Class, { _id: txes[0].objectId as Ref<Class<Doc>> })
    expect(first.length).toBe(1)
    const second = await model.findAll(core.class.Class, { _id: { $in: [txes[0].objectId as Ref<Class<Doc>>, txes[5].objectId as Ref<Class<Doc>>] } })
    expect(second.length).toBe(2)
    const third = await model.findAll(core.class.Space, { name: { $in: ['Sp1', 'Sp2'] } })
    expect(third.length).toBe(2)
    const like = await model.findAll(core.class.Space, { name: { $like: 'Sp%' } })
    expect(like.length).toBe(2)
    const result = await model.findAll(core.class.Class, { domain: 'domain' as Domain })
    expect(result.length).toBe(0)
  })

  it('should allow delete', async () => {
    const hierarchy = new Hierarchy()
    for (const tx of txes) hierarchy.tx(tx)
    const connectionParams = {
      url: process.env.ELASTIC_URL ?? 'http://localhost:9200',
      username: process.env.ELASTIC_USERNAME ?? 'elastic',
      password: process.env.ELASTIC_PASSWORD ?? 'changeme'
    }
    const model = new ElasticStorage(hierarchy, 'workspace', connectionParams)
    for (const tx of txes) await model.tx(tx)
    const first = await model.findAll(core.class.Class, { _id: txes[0].objectId as Ref<Class<Obj>> })
    expect(first.length).toBe(1)
    const ops = withOperations(core.account.System, model)
    await ops.removeDoc(first[0]._class, first[0].space, first[0]._id)
    const afterDelete = await model.findAll(core.class.Class, { _id: txes[0].objectId as Ref<Class<Obj>> })
    expect(afterDelete.length).toBe(0)
  })
})
