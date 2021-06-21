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

import core, { Storage, Account, generateId, Ref, Space, Tx, TxCreateDoc, Hierarchy, ModelDb, Doc, TxAddCollection, Member, ClassifierKind, Class, Domain } from '@anticrm/core'
import { SecurityModel, SecurityStorage } from '../security'

const txes = require('../model.tx.json') as Tx[] // eslint-disable-line @typescript-eslint/no-var-requires
const user = 'testUser' as Ref<Account>

describe('security', () => {
  let db: Storage
  let hierarchy: Hierarchy
  let securityStorage: SecurityStorage
  let securityModel: SecurityModel
  async function initDb (): Promise<void> {
    const objectClassTx: TxCreateDoc<Doc> = {
      objectId: 'task' as Ref<Class<Doc>>,
      objectSpace: core.space.Model,
      _id: generateId(),
      space: core.space.Tx,
      modifiedBy: user,
      modifiedOn: Date.now(),
      _class: core.class.TxCreateDoc,
      objectClass: core.class.Class,
      attributes: {
        domain: 'task' as Domain,
        kind: ClassifierKind.CLASS,
        extends: core.class.Doc
      }
    }

    hierarchy = new Hierarchy()
    for (const tx of txes) hierarchy.tx(tx)
    hierarchy.tx(objectClassTx)

    db = new ModelDb(hierarchy)
    securityModel = new SecurityModel(hierarchy)
    for (const tx of txes) await securityModel.tx(tx)
    await securityModel.tx(objectClassTx)
    securityStorage = new SecurityStorage(db, hierarchy, securityModel, user)
    for (const tx of txes) await securityStorage.tx(tx)
    await securityStorage.tx(objectClassTx)
  }

  beforeEach(async () => {
    return await initDb()
  })

  it('space visibility, should visible all spaces', async () => {
    const init = await securityStorage.findAll(core.class.Space, {})
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
    await securityModel.tx(privateSpaceTx)
    await securityStorage.tx(privateSpaceTx)

    const second = await securityStorage.findAll(core.class.Space, {})
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
    await securityModel.tx(spaceTx)
    await securityStorage.tx(spaceTx)

    const objectTx: TxCreateDoc<Doc> = {
      objectId: generateId(),
      objectSpace: spaceTx.objectId,
      _id: generateId(),
      space: core.space.Tx,
      modifiedBy: user,
      modifiedOn: Date.now(),
      _class: core.class.TxCreateDoc,
      objectClass: 'task' as Ref<Class<Doc>>,
      attributes: {
      }
    }

    await db.tx(objectTx) // add object ignore security

    const first = await securityStorage.findAll('task' as Ref<Class<Doc>>, {})
    expect(first).toHaveLength(0)

    await securityStorage.findAll('task' as Ref<Class<Doc>>, { space: objectTx.objectSpace }).catch((error: Error) => {
      expect(error.message).toBe('ERROR: security.AccessDenied')
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

    await securityModel.tx(addMemberTx)
    await securityStorage.tx(addMemberTx)

    const third = await securityStorage.findAll('task' as Ref<Class<Doc>>, { space: objectTx.objectSpace })
    expect(third).toHaveLength(1)

    const last = await securityStorage.findAll('task' as Ref<Class<Doc>>, { })
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
    await securityModel.tx(spaceTx)
    await securityStorage.tx(spaceTx)

    const objectTx: TxCreateDoc<Doc> = {
      objectId: generateId(),
      objectSpace: spaceTx.objectId,
      _id: generateId(),
      space: core.space.Tx,
      modifiedBy: user,
      modifiedOn: Date.now(),
      _class: core.class.TxCreateDoc,
      objectClass: 'task' as Ref<Class<Doc>>,
      attributes: {
      }
    }

    await securityStorage.tx(objectTx).catch((error: Error) => {
      expect(error.message).toBe('ERROR: security.AccessDenied')
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

    await securityModel.tx(addMemberTx)
    await securityStorage.tx(addMemberTx)
    await securityStorage.tx(objectTx)
    expect(true).toBeTruthy()
  })
})
