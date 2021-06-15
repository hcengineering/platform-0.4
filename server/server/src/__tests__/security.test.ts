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

import core, { Storage, Account, generateId, Ref, Space, Tx, TxCreateDoc, Hierarchy, ModelDb, Doc, TxAddCollection, Member } from '@anticrm/core'
import { SecurityStorage } from '../securityStorage'

const txes = require('../model.tx.json') as Tx[] // eslint-disable-line @typescript-eslint/no-var-requires
const user = 'testUser' as Ref<Account>

describe('security', () => {
  let db: Storage
  let securityStorage: SecurityStorage
  async function initDb (): Promise<void> {
    const hierarchy = new Hierarchy()
    for (const tx of txes) hierarchy.tx(tx)

    db = new ModelDb(hierarchy)
    securityStorage = new SecurityStorage(db, hierarchy)
    for (const tx of txes) await securityStorage.tx(tx, user)
  }

  beforeEach(async () => {
    return await initDb()
  })

  it('space visibility, should visible all spaces', async () => {
    const init = await securityStorage.findAll(core.class.Space, {}, user)
    expect(init).toHaveLength(3)

    const privateSpaceTx: TxCreateDoc<Space> = {
      objectId: generateId(),
      objectSpace: core.space.Model,
      _id: generateId(),
      space: core.space.Tx,
      modifiedBy: user,
      modifiedOn: Date.now(),
      _class: core.class.TxCreateDoc,
      objectClass: core.class.Space,
      attributes: {
        name: 'test',
        description: 'test private Space',
        private: true
      }
    }
    await securityStorage.tx(privateSpaceTx, user)

    const second = await securityStorage.findAll(core.class.Space, {}, user)
    expect(second).toHaveLength(4)
  })

  it('object visibility, the object must be visible in user spaces', async () => {
    expect.assertions(4)

    const spaceTx: TxCreateDoc<Space> = {
      objectId: generateId(),
      objectSpace: core.space.Model,
      _id: generateId(),
      space: core.space.Tx,
      modifiedBy: user,
      modifiedOn: Date.now(),
      _class: core.class.TxCreateDoc,
      objectClass: core.class.Space,
      attributes: {
        name: 'test',
        description: 'test public Space',
        private: true
      }
    }
    await securityStorage.tx(spaceTx, user)

    const objectTx: TxCreateDoc<Doc> = {
      objectId: generateId(),
      objectSpace: spaceTx.objectId,
      _id: generateId(),
      space: core.space.Tx,
      modifiedBy: user,
      modifiedOn: Date.now(),
      _class: core.class.TxCreateDoc,
      objectClass: core.class.Doc,
      attributes: {}
    }

    await db.tx(objectTx) // add object ignore security

    const first = await securityStorage.findAll(core.class.Doc, {}, user)
    expect(first).toHaveLength(0)

    await securityStorage.findAll(core.class.Doc, { space: objectTx.objectSpace }, user).catch((error: Error) => {
      expect(error.message).toBe('Access denied')
    })

    const addMemberTx: TxAddCollection<Space, Member> = {
      objectId: spaceTx.objectId,
      objectSpace: core.space.Model,
      _id: generateId(),
      space: core.space.Tx,
      modifiedBy: user,
      modifiedOn: Date.now(),
      collection: 'members',
      _class: core.class.TxAddCollection,
      itemClass: core.class.Space,
      attributes: {
        account: user
      }
    }

    await securityStorage.tx(addMemberTx, user)

    const third = await securityStorage.findAll(core.class.Doc, { space: objectTx.objectSpace }, user)
    expect(third).toHaveLength(1)

    const last = await securityStorage.findAll(core.class.Doc, { }, user)
    expect(last).toHaveLength(1)
  })

  it('tx', async () => {
    expect.assertions(2)

    const spaceTx: TxCreateDoc<Space> = {
      objectId: generateId(),
      objectSpace: core.space.Model,
      _id: generateId(),
      space: core.space.Tx,
      modifiedBy: user,
      modifiedOn: Date.now(),
      _class: core.class.TxCreateDoc,
      objectClass: core.class.Space,
      attributes: {
        name: 'test',
        description: 'test public Space',
        private: false
      }
    }
    await securityStorage.tx(spaceTx, user)

    const objectTx: TxCreateDoc<Doc> = {
      objectId: generateId(),
      objectSpace: spaceTx.objectId,
      _id: generateId(),
      space: core.space.Tx,
      modifiedBy: user,
      modifiedOn: Date.now(),
      _class: core.class.TxCreateDoc,
      objectClass: core.class.Doc,
      attributes: {}
    }

    await securityStorage.tx(objectTx, user).catch((error: Error) => {
      expect(error.message).toBe('Access denied')
    })

    const addMemberTx: TxAddCollection<Space, Member> = {
      objectId: spaceTx.objectId,
      objectSpace: core.space.Model,
      _id: generateId(),
      space: core.space.Tx,
      modifiedBy: user,
      modifiedOn: Date.now(),
      collection: 'members',
      _class: core.class.TxAddCollection,
      itemClass: core.class.Space,
      attributes: {
        account: user
      }
    }

    await securityStorage.tx(addMemberTx, user)
    await securityStorage.tx(objectTx, user)
    expect(true).toBeTruthy()
  })
})
