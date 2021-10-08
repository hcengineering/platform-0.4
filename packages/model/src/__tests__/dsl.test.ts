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

import { Class, Ref, Obj, Doc, ClassifierKind, Domain, Space, Timestamp, Account, DOMAIN_MODEL } from '@anticrm/core'
import { Model, Prop, TypeString, Builder } from '../dsl'
import core from '..'

function removeIds (txes: Doc[]): void {
  txes.forEach((i) => {
    delete (i as Partial<Doc>)._id
  })
}

describe('dsl', () => {
  it('should not fail empty generateTx', () => {
    const builder = new Builder()
    builder.createModel()
    expect(builder.getTxes()).toEqual([])
  })

  it('should generate txes', () => {
    @Model('class:test.MyClass' as Ref<Class<Obj>>, core.class.Doc)
    class MyClass {
      _class!: Ref<Class<MyClass>>
      @Prop(TypeString()) name!: string
    }
    const builder = new Builder()
    builder.createModel(MyClass)
    const txes = builder.getTxes()
    removeIds(txes)
    expect(txes).toEqual([
      {
        _class: 'class:core.TxCreateDoc',
        space: 'space:core.Tx',
        modifiedBy: 'account:core.System',
        modifiedOn: 0,
        createOn: 0,
        objectId: 'class:test.MyClass',
        objectClass: 'class:core.Class',
        objectSpace: 'space:core.Model',
        sid: 0,
        attributes: {
          kind: 0,
          extends: 'class:core.Doc'
        }
      },
      {
        objectId: 'class:test.MyClass',
        _class: 'class:core.TxCreateDoc',
        space: 'space:core.Tx',
        modifiedBy: 'account:core.System',
        modifiedOn: 0,
        createOn: 0,
        objectSpace: 'space:core.Model',
        objectClass: 'class:core.Attribute',
        sid: 0,
        attributes: {
          type: {
            _class: 'class:core.TypeString'
          },
          name: 'name'
        }
      }
    ])
  })

  it('should generate txes extends', () => {
    @Model('class:test.MyClass' as Ref<Class<Obj>>, core.class.Doc)
    class MyClass {
      _class!: Ref<Class<MyClass>>
      @Prop(TypeString()) name!: string
    }
    @Model('class:test.MyClass2' as Ref<Class<Obj>>, 'class:test.MyClass' as Ref<Class<Obj>>)
    class MyClass2 extends MyClass {
      @Prop(TypeString()) lastName!: string
    }

    const valid = [
      {
        _class: 'class:core.TxCreateDoc',
        space: 'space:core.Tx',
        modifiedBy: 'account:core.System',
        modifiedOn: 0,
        createOn: 0,
        objectId: 'class:test.MyClass',
        objectClass: 'class:core.Class',
        objectSpace: 'space:core.Model',
        sid: 0,
        attributes: {
          kind: 0,
          extends: 'class:core.Doc'
        }
      },
      {
        objectId: 'class:test.MyClass',
        _class: 'class:core.TxCreateDoc',
        space: 'space:core.Tx',
        modifiedBy: 'account:core.System',
        modifiedOn: 0,
        createOn: 0,
        objectSpace: 'space:core.Model',
        objectClass: 'class:core.Attribute',
        sid: 0,
        attributes: {
          type: {
            _class: 'class:core.TypeString'
          },
          name: 'name'
        }
      },
      {
        _class: 'class:core.TxCreateDoc',
        space: 'space:core.Tx',
        modifiedBy: 'account:core.System',
        modifiedOn: 0,
        createOn: 0,
        objectId: 'class:test.MyClass2',
        objectClass: 'class:core.Class',
        objectSpace: 'space:core.Model',
        sid: 0,
        attributes: {
          kind: 0,
          extends: 'class:test.MyClass'
        }
      },
      {
        objectId: 'class:test.MyClass2',
        _class: 'class:core.TxCreateDoc',
        space: 'space:core.Tx',
        modifiedBy: 'account:core.System',
        modifiedOn: 0,
        createOn: 0,
        objectSpace: 'space:core.Model',
        objectClass: 'class:core.Attribute',
        sid: 0,
        attributes: {
          type: {
            _class: 'class:core.TypeString'
          },
          name: 'lastName'
        }
      }
    ]

    const builder = new Builder()
    builder.createModel(MyClass, MyClass2)
    const txes = builder.getTxes()
    removeIds(txes)
    expect(txes).toEqual(valid)

    const builder2 = new Builder()
    builder2.createModel(MyClass2, MyClass)
    const txes2 = builder2.getTxes()
    removeIds(txes2)
    expect(txes).toEqual(valid)
  })

  it('check document options', () => {
    const builder = new Builder()

    @Model(core.class.Obj, core.class.Obj, DOMAIN_MODEL)
    class TObj implements Obj {
      _class!: Ref<Class<this>>
    }

    const MyClassId = 'class:test.MyClass' as Ref<Class<Obj>>
    @Model(MyClassId, core.class.Obj, DOMAIN_MODEL)
    class MyClass extends TObj implements Class<Doc> {
      @Prop(TypeString()) name!: string

      _id!: Ref<this>
      space!: Ref<Space>
      modifiedOn!: Timestamp
      modifiedBy!: Ref<Account>
      createOn!: Timestamp
      kind!: ClassifierKind
      extends!: Ref<Class<Obj>>
      domain!: Domain
    }
    builder.createModel(TObj, MyClass)

    builder.createDoc(
      MyClassId,
      {
        kind: ClassifierKind.CLASS
      },
      core.class.Class,
      {
        modifiedBy: core.account.System,
        createOn: Date.now(),
        modifiedOn: Date.now()
      }
    )
    expect(builder.getTxes().length).toEqual(4)
  })
})
