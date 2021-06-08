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

import { Domain, Ref, Class, Obj } from '../classes'
import core from '../component'
import { Hierarchy } from '../hierarchy'
import { ModelDb } from '../memdb'
import { Tx } from '../tx'
import { describe, it, expect } from '@jest/globals'

const txes = require('./core.tx.json') as Tx[] // eslint-disable-line @typescript-eslint/no-var-requires

describe('hierarchy', () => {
  it('should build hierarchy', async () => {
    const hierarchy = new Hierarchy()
    for (const tx of txes) await hierarchy.tx(tx)
    const ancestors = hierarchy.getAncestors(core.class.TxCreateDoc)
    expect(ancestors).toContain(core.class.Tx)
  })

  it('should query model', async () => {
    const hierarchy = new Hierarchy()
    for (const tx of txes) await hierarchy.tx(tx)
    const model = new ModelDb(hierarchy)
    for (const tx of txes) await model.tx(tx)
    const result = await model.findAll(core.class.Class, {})
    expect(result.length).toBe(3)
  })

  it('should query model with params', async () => {
    const hierarchy = new Hierarchy()
    for (const tx of txes) hierarchy.tx(tx)
    const model = new ModelDb(hierarchy)
    for (const tx of txes) await model.tx(tx)
    const first = await model.findAll(core.class.Class, {
      _id: txes[0].objectId as Ref<Class<Obj>>,
      domain: 'model' as Domain
    })
    expect(first.length).toBe(1)
    const result = await model.findAll(core.class.Class, {
      _id: txes[0].objectId as Ref<Class<Obj>>,
      domain: 'domain' as Domain
    })
    expect(result.length).toBe(0)
  })
})
