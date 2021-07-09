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

import { describe, expect, it } from '@jest/globals'
import type { Account, Doc, Ref, Space } from '../classes'
import core from '../component'
import { Hierarchy } from '../hierarchy'
import { ModelDb, TxDb } from '../memdb'
import { createShortRef } from '../shortref'
import { Storage } from '../storage'
import { genMinModel } from './minmodel'

const txes = genMinModel()

describe('memdb.shortref', () => {
  it('check create ShortRef', async () => {
    const hierarchy = new Hierarchy()
    for (const tx of txes) await hierarchy.tx(tx)
    const model = new ModelDb(hierarchy)
    for (const tx of txes) await model.tx(tx)

    const txStore = new TxDb(hierarchy)

    const storage: Storage = {
      findAll: async (_class, query) => await model.findAll(_class, query),
      tx: async (tx) => {
        await model.tx(tx)
        await txStore.tx(tx)
      }
    }

    const sp = (await model.findAll(core.class.Space, {}))[0]

    const t1 = await createShortRef(storage, '' as Ref<Account>, '' as Ref<Space>, sp._id, sp._class, 'TASK')
    expect(t1).toBe('TASK-1')

    expect((await txStore.findAll(core.class.Tx, {})).length).toEqual(1)

    const t2 = await createShortRef(storage, '' as Ref<Account>, '' as Ref<Space>, sp._id, sp._class, 'TASK')
    expect(t2).toBe('TASK-2')

    expect((await txStore.findAll(core.class.Tx, {})).length).toEqual(2)

    model.addDoc({
      _id: 'TASK-3' as Ref<Doc>,
      _class: core.class.Title,
      space: '' as Ref<Space>,
      modifiedBy: '' as Ref<Account>,
      modifiedOn: Date.now()
    })

    const t4 = await createShortRef(storage, '' as Ref<Account>, '' as Ref<Space>, sp._id, sp._class, 'TASK')
    expect(t4).toBe('TASK-4')

    expect((await txStore.findAll(core.class.Tx, {})).length).toEqual(3)
  })
})
