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

import type { Tx } from '@anticrm/core'
import core, { Hierarchy, Domain } from '@anticrm/core'
import { ElasticStorage } from '../index'

const txes = require('./core.tx.json') as Tx[] // eslint-disable-line @typescript-eslint/no-var-requires

describe('hierarchy', () => {
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
    const second = await model.findAll(core.class.Class, { domain: 'model' as Domain })
    expect(second.length).toBe(7)
    const first = await model.findAll(core.class.Class, { _id: txes[0].objectId })
    expect(first.length).toBe(1)
    const result = await model.findAll(core.class.Class, { _id: txes[0].objectId, domain: 'domain' as Domain })
    expect(result.length).toBe(0)
  })
})
