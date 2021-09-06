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

import { component, Component } from '@anticrm/status'
import { Account, Attribute, Class, Doc, DOMAIN_MODEL, PropertyType, Ref, Space, Type } from '../classes'
import core from '../component'
import { _createClass, _createDoc } from '../minmodel'
import { generateModelDiff } from '../model'
import { DOMAIN_TX, Tx } from '../tx'

const testIds = component('types' as Component, {
  class: {
    Type: '' as Ref<Class<Type<PropertyType>>>,
    Ref: '' as Ref<Class<Doc>>
  },
  attribute: {
    Id: '' as Ref<Attribute<PropertyType>>
  },
  space: {
    TestSpace: '' as Ref<Space>
  }
})

function genTx (variant: number): Tx[] {
  const txes: Tx[] = []
  // Fill Tx'es with basic model classes.
  txes.push(_createClass(core.class.Obj, {}, DOMAIN_MODEL))
  txes.push(_createClass(core.class.Attribute, { extends: core.class.Doc }))

  if (variant === 1) {
    txes.push(_createClass(core.class.Title, { extends: core.class.Doc }))
  }
  if (variant === 2) {
    txes.push(_createClass(core.class.Reference, { extends: core.class.Doc }))
  }

  txes.push(
    _createDoc(core.class.Attribute, {
      attributeOf: core.class.Obj,
      name: '_class',
      type: { _class: testIds.class.Ref }
    })
  )
  txes.push(_createClass(core.class.Doc, { extends: core.class.Obj }))
  txes.push(
    _createDoc(
      core.class.Attribute,
      { attributeOf: core.class.Obj, name: '_id', type: { _class: testIds.class.Ref } },
      testIds.attribute.Id
    )
  )

  txes.push(_createClass(core.class.Class, { extends: core.class.Doc }))
  txes.push(_createClass(core.class.Space, { extends: core.class.Doc }))
  txes.push(_createClass(core.class.Account, { extends: core.class.Doc }))

  txes.push(_createClass(core.class.Tx, { extends: core.class.Doc }, DOMAIN_TX))
  txes.push(_createClass(core.class.TxCreateDoc, { extends: core.class.Tx }))
  txes.push(_createClass(core.class.TxUpdateDoc, { extends: core.class.Tx }))
  txes.push(_createClass(core.class.TxRemoveDoc, { extends: core.class.Tx }))

  const u1 = 'User1' as Ref<Account>
  const u2 = 'User2' as Ref<Account>
  txes.push(
    _createDoc(core.class.Account, { email: 'user1@site.com', name: 'User1' }, u1),
    _createDoc(core.class.Account, { email: 'user2@site.com', name: 'User2' }, u2),
    _createDoc(
      core.class.Space,
      {
        name: 'Sp1',
        description: 'some text',
        private: false,
        members: [u1, u2]
      },
      undefined,
      u1
    ), // <--- This one is not by system user, so it should be updated on
    _createDoc(core.class.Space, {
      name: 'Sp2',
      description: '',
      private: false,
      members: [u1]
    }),
    _createDoc(
      core.class.Space,
      {
        name: 'Sp3',
        description: variant === 1 ? 'some text' : 'some other text',
        private: variant === 2,
        members: variant === 1 ? [u1, u2] : [u2]
      },
      testIds.space.TestSpace
    )
  )
  return txes
}

describe('model-diff', () => {
  it('should save all tx', async () => {
    const tx1 = genTx(1)
    const tx2 = genTx(2)

    const result = await generateModelDiff(tx1, tx2)
    expect(result.length).toEqual(7)
    ;[0, 1, 2].forEach((i) => {
      expect(result[i]._class).toEqual(core.class.TxRemoveDoc)
    })
    expect(result[3]._class).toEqual(core.class.TxUpdateDoc)
    ;[4, 5, 6].forEach((i) => {
      expect(result[i]._class).toEqual(core.class.TxCreateDoc)
    })
  })
})
