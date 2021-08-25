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
  ClassifierKind,
  Doc,
  Domain,
  generateId,
  Hierarchy,
  ModelDb,
  Ref,
  Space,
  Storage,
  Tx,
  TxCreateDoc,
  TxRemoveDoc,
  TxUpdateDoc,
  _genMinModel
} from '@anticrm/core'
import builder from '@anticrm/model-all'
import { ClientInfo, SecurityClientStorage, SecurityModel } from '../security'

const txes = builder.getTxes()
const user: ClientInfo = {
  clientId: '',
  accountId: core.account.System,
  workspaceId: 'string',
  tx: (tx: Tx) => {}
}

describe('security', () => {
  let db: Storage
  let model: ModelDb
  let hierarchy: Hierarchy
  let securityStorage: SecurityClientStorage
  let security: SecurityModel

  async function initDb (): Promise<void> {
    const objectClassTx: TxCreateDoc<Doc> = {
      objectId: 'task' as Ref<Class<Doc>>,
      objectSpace: core.space.Model,
      _id: generateId(),
      space: core.space.Tx,
      modifiedBy: user.accountId,
      createOn: Date.now(),
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
    model = new ModelDb(hierarchy)
    security = await SecurityModel.create(hierarchy, model)
    for (const tx of txes) await security.tx(tx)
    await security.tx(objectClassTx)
    securityStorage = new SecurityClientStorage(
      security,
      {
        findAll: async (_class, query) => await db.findAll(_class, query),
        tx: async (clientId, tx) => {
          hierarchy.tx(tx)
          await db.tx(tx)
          await security.tx(tx)
        }
      },
      hierarchy,
      user
    )
  }

  beforeAll(async () => {
    return await initDb()
  })

  it('object visibility, the object must be visible in user spaces', async () => {
    expect.assertions(5)

    const spaceTx: TxCreateDoc<Space> = {
      objectId: generateId(),
      objectSpace: core.space.Model,
      _id: generateId(),
      space: core.space.Tx,
      modifiedBy: user.accountId,
      createOn: Date.now(),
      modifiedOn: Date.now(),
      _class: core.class.TxCreateDoc,
      objectClass: core.class.Space,
      attributes: {
        name: 'test',
        description: 'test public Space',
        private: false,
        members: []
      }
    }
    await securityStorage.tx(spaceTx)

    const objectTx: TxCreateDoc<Doc> = {
      objectId: generateId(),
      objectSpace: spaceTx.objectId,
      _id: generateId(),
      space: core.space.Tx,
      modifiedBy: user.accountId,
      createOn: Date.now(),
      modifiedOn: Date.now(),
      _class: core.class.TxCreateDoc,
      objectClass: 'task' as Ref<Class<Doc>>,
      attributes: {}
    }

    await db.tx(objectTx) // add object ignore security

    const first = await securityStorage.findAll('task' as Ref<Class<Doc>>, {})
    expect(first).toHaveLength(0)

    await securityStorage.findAll('task' as Ref<Class<Doc>>, { space: objectTx.objectSpace }).catch((error: Error) => {
      expect(error.message).toBe('ERROR: security.AccessDenied. {}')
    })

    await securityStorage
      .findAll('task' as Ref<Class<Doc>>, { space: { $in: [objectTx.objectSpace] } })
      .catch((error: Error) => {
        expect(error.message).toBe('ERROR: security.AccessDenied. {}')
      })

    const addMemberTx: TxUpdateDoc<Space> = {
      objectId: spaceTx.objectId,
      objectSpace: core.space.Model,
      _id: generateId(),
      space: core.space.Tx,
      modifiedBy: user.accountId,
      createOn: Date.now(),
      modifiedOn: Date.now(),
      _class: core.class.TxUpdateDoc,
      objectClass: core.class.Space,
      operations: {
        $push: { members: user.accountId }
      }
    }

    await securityStorage.tx(addMemberTx)

    const third = await securityStorage.findAll('task' as Ref<Class<Doc>>, { space: objectTx.objectSpace })
    expect(third).toHaveLength(1)

    const last = await securityStorage.findAll('task' as Ref<Class<Doc>>, {})
    expect(last).toHaveLength(1)
  })

  it('tx', async () => {
    expect.assertions(2)

    const spaceTx: TxCreateDoc<Space> = {
      objectId: generateId(),
      objectSpace: core.space.Model,
      _id: generateId(),
      space: core.space.Tx,
      modifiedBy: user.accountId,
      createOn: Date.now(),
      modifiedOn: Date.now(),
      _class: core.class.TxCreateDoc,
      objectClass: core.class.Space,
      attributes: {
        name: 'test',
        description: 'test public Space',
        private: false,
        members: []
      }
    }
    await securityStorage.tx(spaceTx)

    const objectTx: TxCreateDoc<Doc> = {
      objectId: generateId(),
      objectSpace: spaceTx.objectId,
      _id: generateId(),
      space: core.space.Tx,
      modifiedBy: user.accountId,
      createOn: Date.now(),
      modifiedOn: Date.now(),
      _class: core.class.TxCreateDoc,
      objectClass: 'task' as Ref<Class<Doc>>,
      attributes: {}
    }

    await securityStorage.tx(objectTx).catch((error: Error) => {
      expect(error.message).toBe('ERROR: security.AccessDenied. {}')
    })

    const addMemberTx: TxUpdateDoc<Space> = {
      objectId: spaceTx.objectId,
      objectSpace: core.space.Model,
      _id: generateId(),
      space: core.space.Tx,
      modifiedBy: user.accountId,
      createOn: Date.now(),
      modifiedOn: Date.now(),
      _class: core.class.TxUpdateDoc,
      objectClass: core.class.Space,
      operations: { $push: { members: user.accountId } }
    }

    await securityStorage.tx(addMemberTx)
    await securityStorage.tx(objectTx)
    expect(true).toBeTruthy()
  })

  it('spaceChange', async () => {
    expect.assertions(3)

    const privateSpaceTx: TxCreateDoc<Space> = {
      objectId: generateId(),
      objectSpace: core.space.Model,
      _id: generateId(),
      space: core.space.Tx,
      modifiedBy: user.accountId,
      createOn: Date.now(),
      modifiedOn: Date.now(),
      _class: core.class.TxCreateDoc,
      objectClass: core.class.Space,
      attributes: {
        name: 'test',
        description: 'test public Space',
        private: true,
        members: []
      }
    }
    await securityStorage.tx(privateSpaceTx)

    const addMembertoPrivateTx: TxUpdateDoc<Space> = {
      objectId: privateSpaceTx.objectId,
      objectSpace: core.space.Model,
      _id: generateId(),
      space: core.space.Tx,
      modifiedBy: user.accountId,
      createOn: Date.now(),
      modifiedOn: Date.now(),
      _class: core.class.TxUpdateDoc,
      objectClass: core.class.Space,
      operations: { $push: { members: user.accountId } }
    }

    await securityStorage.tx(addMembertoPrivateTx).catch((error: Error) => {
      expect(error.message).toBe('ERROR: security.AccessDenied. {}')
    })

    const removePrivateTx: TxRemoveDoc<Space> = {
      objectId: privateSpaceTx.objectId,
      objectSpace: core.space.Model,
      _id: generateId(),
      space: core.space.Tx,
      modifiedBy: user.accountId,
      createOn: Date.now(),
      modifiedOn: Date.now(),
      _class: core.class.TxUpdateDoc,
      objectClass: core.class.Space
    }

    await securityStorage.tx(removePrivateTx).catch((error: Error) => {
      expect(error.message).toBe('ERROR: security.AccessDenied. {}')
    })

    const publicSpaceTx: TxCreateDoc<Space> = {
      objectId: generateId(),
      objectSpace: core.space.Model,
      _id: generateId(),
      space: core.space.Tx,
      modifiedBy: user.accountId,
      createOn: Date.now(),
      modifiedOn: Date.now(),
      _class: core.class.TxCreateDoc,
      objectClass: core.class.Space,
      attributes: {
        name: 'test',
        description: 'test public Space',
        private: false,
        members: []
      }
    }
    await securityStorage.tx(publicSpaceTx)

    const addMemberTx: TxUpdateDoc<Space> = {
      objectId: publicSpaceTx.objectId,
      objectSpace: core.space.Model,
      _id: generateId(),
      space: core.space.Tx,
      modifiedBy: user.accountId,
      createOn: Date.now(),
      modifiedOn: Date.now(),
      _class: core.class.TxUpdateDoc,
      objectClass: core.class.Space,
      operations: { $push: { members: user.accountId } }
    }

    await securityStorage.tx(addMemberTx)

    const removePublicTx: TxRemoveDoc<Space> = {
      objectId: publicSpaceTx.objectId,
      objectSpace: core.space.Model,
      _id: generateId(),
      space: core.space.Tx,
      modifiedBy: user.accountId,
      createOn: Date.now(),
      modifiedOn: Date.now(),
      _class: core.class.TxUpdateDoc,
      objectClass: core.class.Space
    }

    await securityStorage.tx(removePublicTx)

    expect(true).toBeTruthy()
  })
  it('check security mode construction', async () => {
    const txes = _genMinModel()
    const hierarchy = new Hierarchy()
    for (const tx of txes) hierarchy.tx(tx)
    const modelDb = new ModelDb(hierarchy)
    for (const tx of txes) await modelDb.tx(tx)

    const securityModel = await SecurityModel.create(hierarchy, modelDb)

    expect(securityModel.getSpaces('User1' as Ref<Account>).size).toEqual(4)
  })

  it('check security push/pull', async () => {
    const txes = _genMinModel()
    const hierarchy = new Hierarchy()
    for (const tx of txes) hierarchy.tx(tx)
    const modelDb = new ModelDb(hierarchy)
    for (const tx of txes) await modelDb.tx(tx)

    const securityModel = await SecurityModel.create(hierarchy, modelDb)

    const u1 = 'User1' as Ref<Account>
    const spaces = await modelDb.findAll(core.class.Space, {})
    expect(spaces.length).toEqual(2)

    const tx: TxUpdateDoc<Space> = {
      _id: generateId(),
      _class: core.class.TxUpdateDoc,
      space: core.space.Tx,
      modifiedBy: u1,
      modifiedOn: Date.now(),
      createOn: Date.now(),
      objectId: spaces[0]._id,
      objectClass: core.class.Space,
      objectSpace: core.space.Model,
      operations: {
        $pull: {
          members: u1
        }
      }
    }
    await securityModel.tx(tx)

    expect((await securityModel.getUserSpaces('User1' as Ref<Account>)).size).toEqual(3)
  })

  it('check change space private', async () => {
    const txes = _genMinModel()
    const hierarchy = new Hierarchy()
    for (const tx of txes) hierarchy.tx(tx)
    const modelDb = new ModelDb(hierarchy)
    for (const tx of txes) await modelDb.tx(tx)

    const securityModel = await SecurityModel.create(hierarchy, modelDb)

    const u1 = 'User1' as Ref<Account>
    const spaces = await modelDb.findAll(core.class.Space, {})
    expect(spaces.length).toEqual(2)

    let tx: TxUpdateDoc<Space> = {
      _id: generateId(),
      _class: core.class.TxUpdateDoc,
      space: core.space.Tx,
      modifiedBy: u1,
      createOn: Date.now(),
      modifiedOn: Date.now(),
      objectId: spaces[0]._id,
      objectClass: core.class.Space,
      objectSpace: core.space.Model,
      operations: {
        private: true
      }
    }
    await securityModel.tx(tx)

    tx = {
      _id: generateId(),
      _class: core.class.TxUpdateDoc,
      space: core.space.Tx,
      modifiedBy: u1,
      createOn: Date.now(),
      modifiedOn: Date.now(),
      objectId: spaces[0]._id,
      objectClass: core.class.Space,
      objectSpace: core.space.Model,
      operations: {
        private: false
      }
    }
    await securityModel.tx(tx)

    expect(securityModel.getSpaces('User1' as Ref<Account>).size).toEqual(4)
  })
  it('check remove space', async () => {
    const txes = _genMinModel()
    const hierarchy = new Hierarchy()
    for (const tx of txes) hierarchy.tx(tx)
    const modelDb = new ModelDb(hierarchy)
    for (const tx of txes) await modelDb.tx(tx)

    const securityModel = await SecurityModel.create(hierarchy, modelDb)

    const u1 = 'User1' as Ref<Account>
    const spaces = await modelDb.findAll(core.class.Space, {})
    expect(spaces.length).toEqual(2)

    const tx: TxRemoveDoc<Space> = {
      _id: generateId(),
      _class: core.class.TxRemoveDoc,
      space: core.space.Tx,
      modifiedBy: u1,
      createOn: Date.now(),
      modifiedOn: Date.now(),
      objectId: spaces[0]._id,
      objectClass: core.class.Space,
      objectSpace: core.space.Model
    }
    expect(securityModel.checkSpaceTx(u1, tx)).toEqual(true)
    await securityModel.tx(tx)

    expect(securityModel.getSpaces('User1' as Ref<Account>).size).toEqual(3)
  })
})
