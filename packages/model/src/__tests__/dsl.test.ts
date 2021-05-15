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

import type { Class, Ref, Obj, Doc } from '@anticrm/core'
import { Model, Prop, TypeString, generateTx } from '../dsl'
import core from '../component'

function removeIds (txes: Doc[]): void {
  txes.forEach((i) => {
    delete (i as Partial<Doc>)._id
  })
}

describe('dsl', () => {
  it('should not fail empty generateTx', () => {
    expect(generateTx()).toEqual([])
  })

  it('should generate txes', () => {
    @Model('class:test.MyClass' as Ref<Class<Obj>>, core.class.Doc)
    class MyClass {
      _class!: Ref<Class<MyClass>>
      @Prop(TypeString()) name!: string
    }
    const txes = generateTx(MyClass)
    removeIds(txes)
    expect(txes).toEqual([
      {
        _class: 'class:core.TxCreateObject',
        domain: 'model',
        objectId: 'class:test.MyClass',
        attributes: {
          extends: 'class:core.Doc'
        }
      },
      {
        _class: 'class:core.TxAddCollection',
        domain: 'model',
        collection: 'attributes',
        localId: 'name',
        attributes: {
          type: {
            _class: 'class:core.TypeString'
          }
        },
        objectId: 'class:test.MyClass'
      }
    ])
  })

  it('should generate txes extends', () => {
    @Model('class:test.MyClass' as Ref<Class<Obj>>, core.class.Doc)
    class MyClass {
      _class!: Ref<Class<MyClass>>
      @Prop(TypeString()) name!: string
    }
    @Model(
      'class:test.MyClass2' as Ref<Class<Obj>>,
      'class:test.MyClass' as Ref<Class<Obj>>
    )
    class MyClass2 extends MyClass {
      @Prop(TypeString()) lastName!: string
    }

    const valid = [
      {
        _class: 'class:core.TxCreateObject',
        domain: 'model',
        objectId: 'class:test.MyClass',
        attributes: {
          extends: 'class:core.Doc'
        }
      },
      {
        _class: 'class:core.TxAddCollection',
        domain: 'model',
        collection: 'attributes',
        localId: 'name',
        attributes: {
          type: {
            _class: 'class:core.TypeString'
          }
        },
        objectId: 'class:test.MyClass'
      },
      {
        _class: 'class:core.TxCreateObject',
        domain: 'model',
        objectId: 'class:test.MyClass2',
        attributes: {
          extends: 'class:test.MyClass'
        }
      },
      {
        _class: 'class:core.TxAddCollection',
        domain: 'model',
        collection: 'attributes',
        localId: 'lastName',
        attributes: {
          type: {
            _class: 'class:core.TypeString'
          }
        },
        objectId: 'class:test.MyClass2'
      }
    ]

    const txes = generateTx(MyClass, MyClass2)
    removeIds(txes)
    expect(txes).toEqual(valid)

    const txes2 = generateTx(MyClass2, MyClass)
    removeIds(txes2)
    expect(txes).toEqual(valid)
  })
})
