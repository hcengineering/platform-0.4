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

import type { Tx } from '../tx'
import { createHierarchy } from '../hierarchy'
import { ModelDb } from '../memdb'
import core from '../component'

describe('hierarchy', () => {

  it('should build hierarchy', async () => {
    const txes = ((await import('./core.tx.json')) as any).default as Tx[]
    const hierarchy = createHierarchy()
    for (const tx of txes) hierarchy.tx(tx)
    const ancestors = hierarchy.getAncestors(core.class.TxCreateObject)
    expect(ancestors).toContain(core.class.Tx)
  })

  it('should query model', async () => {
    const txes = ((await import('./core.tx.json')) as any).default as Tx[]
    const hierarchy = createHierarchy()
    for (const tx of txes) hierarchy.tx(tx)
    const model = new ModelDb(hierarchy)
    for (const tx of txes) model.tx(tx)
    const result = await model.findAll(core.class.Class, {})
    expect(result.length).toBe(3)
  })

})
