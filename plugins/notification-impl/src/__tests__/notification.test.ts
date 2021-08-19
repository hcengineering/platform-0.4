//
// Copyright © 2021 Anticrm Platform Contributors.
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
  Data,
  Doc,
  DocumentUpdate,
  generateId,
  Ref,
  Space,
  TxCreateDoc,
  TxUpdateDoc
} from '@anticrm/core'
import { notificationPlugin } from '..'
import { addLocation, getPlugin } from '@anticrm/platform'
import corePlugin, { Client } from '@anticrm/plugin-core'

let client: Client

describe('notification', () => {
  beforeAll(async () => {
    addLocation(corePlugin, async () => await import('@anticrm/plugin-core-dev'))
    addLocation(notificationPlugin, async () => await import('../index'))
    const coreService = await getPlugin(corePlugin.id)
    client = await coreService.getClient()
  })

  it('should subscribe space status', async () => {
    const spaces = await client.findAll(core.class.Space, {})
    expect(spaces.length).toBe(6)
    const space = spaces[0]._id

    const notificationService = await getPlugin(notificationPlugin.id)
    const before = await notificationService.getSubscibeStatus(core.class.Space, space)
    expect(before).not.toBeTruthy()
    await notificationService.subscribeSpace(core.class.Space, space)
    const res = await notificationService.getSubscibeStatus(core.class.Space, space)
    expect(res).toBeTruthy()
    await notificationService.unsubscribeSpace(core.class.Space, space)
    const after = await notificationService.getSubscibeStatus(core.class.Space, space)
    expect(after).not.toBeTruthy()
  })

  it('should subscribe object status', async () => {
    const spaces = await client.findAll(core.class.Space, {})
    expect(spaces.length).toBe(6)
    const space = spaces[0]._id

    const notificationService = await getPlugin(notificationPlugin.id)
    const before = await notificationService.getObjectSubscibeStatus(core.class.Space, core.space.Model, space)
    expect(before).not.toBeTruthy()
    await notificationService.subscribeObject(core.class.Space, core.space.Model, space)
    await notificationService.subscribeObject(core.class.Space, core.space.Model, spaces[1]._id)
    const res = await notificationService.getObjectSubscibeStatus(core.class.Space, core.space.Model, space)
    expect(res).toBeTruthy()
    await notificationService.unsubscribeObject(core.class.Space, core.space.Model, space)
    await notificationService.unsubscribeObject(core.class.Space, core.space.Model, space)
    const after = await notificationService.getObjectSubscibeStatus(core.class.Space, core.space.Model, space)
    expect(after).not.toBeTruthy()
  })

  it('should subscribe space', async (done) => {
    const expectedLength = 5
    let attempt = 0

    const notificationService = await getPlugin(notificationPlugin.id)
    await notificationService.subscribeSpace(core.class.Space, core.space.Model)
    const unsubscribe = notificationService.spaceNotifications(core.class.Space, core.space.Model, (result) => {
      expect(result).toHaveLength(attempt++)
      if (attempt === expectedLength) {
        done()
      }
    })
    for (let i = 0; i < expectedLength; i++) {
      const tx = createDocTx(core.class.Space, core.space.Model, {
        description: '',
        name: generateId(),
        private: false,
        members: []
      })
      await client.tx(tx)
    }
    unsubscribe()
    await notificationService.unsubscribeSpace(core.class.Space, core.space.Model)
  })

  it('should subscribe object and space notify', async (done) => {
    const expectedLength = 5
    let attempt = 0

    const spaces = await client.findAll(core.class.Space, {})
    const space = spaces[0]._id

    const notificationService = await getPlugin(notificationPlugin.id)
    await notificationService.subscribeObject(core.class.Space, core.space.Model, space)
    const unsubscribe = notificationService.spaceNotifications(core.class.Space, core.space.Model, (result) => {
      expect(result).toHaveLength(Math.min(attempt++, 1))
      if (attempt === expectedLength) done()
    })

    for (let i = 0; i < expectedLength; i++) {
      const tx = updateDoc(core.class.Space, core.space.Model, space, {
        $push: { members: i.toString() as Ref<Account> }
      })
      await client.tx(tx)
    }
    unsubscribe()
    await notificationService.unsubscribeObject(core.class.Space, core.space.Model, space)
  })
})

function createDocTx<T extends Doc> (
  _class: Ref<Class<T>>,
  space: Ref<Space>,
  attributes: Data<T>,
  objectId?: Ref<T>
): TxCreateDoc<T> {
  const tx: TxCreateDoc<T> = {
    _id: generateId(),
    _class: core.class.TxCreateDoc,
    space: core.space.Tx,
    modifiedBy: 'test' as Ref<Account>,
    modifiedOn: Date.now(),
    createOn: Date.now(),
    objectId: objectId ?? generateId(),
    objectClass: _class,
    objectSpace: space,
    attributes
  }
  return tx
}

function updateDoc<T extends Doc> (
  _class: Ref<Class<T>>,
  space: Ref<Space>,
  objectId: Ref<T>,
  operations: DocumentUpdate<T>
): TxUpdateDoc<T> {
  const tx: TxUpdateDoc<T> = {
    _id: generateId(),
    _class: core.class.TxUpdateDoc,
    space: core.space.Tx,
    modifiedBy: 'test' as Ref<Account>,
    modifiedOn: Date.now(),
    createOn: Date.now(),
    objectId,
    objectClass: _class,
    objectSpace: space,
    operations
  }
  return tx
}
