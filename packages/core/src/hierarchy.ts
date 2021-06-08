//
// Copyright © 2020, 2021 Anticrm Platform Contributors.
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

import type { Ref, Class, Obj, Data, Domain } from './classes'
import type { Tx, TxCreateObject } from './tx'

import core from './component'

export class Hierarchy {

  private readonly classes = new Map<Ref<Class<Obj>>, Data<Class<Obj>>>()
  private readonly extends = new Map<Ref<Class<Obj>>, Array<Ref<Class<Obj>>>>()

  getAncestors(_class: Ref<Class<Obj>>): Ref<Class<Obj>>[] {
    const result: Ref<Class<Obj>>[] = []
    let cl: Ref<Class<Obj>> | undefined = _class
    while (cl !== undefined) {
      result.push(cl)
      const attrs = this.classes.get(cl)
      cl = attrs?.extends
    }
    return result
  }

  getClass(_class: Ref<Class<Obj>>): Data<Class<Obj>> {
    const data = this.classes.get(_class)
    if (data === undefined)
      throw new Error('class not found: ' + _class)
    return data
  }

  getDomain(_class: Ref<Class<Obj>>): Domain {
    const klazz = this.getClass(_class)
    if (klazz.domain !== undefined)
      return klazz.domain
    if (klazz.extends !== undefined) {
      const domain = this.getDomain(klazz.extends)
      klazz.domain = domain
      return domain
    }
    throw new Error('domain not found: ' + _class)
  }

  tx(tx: Tx): void {
    if (tx._class !== core.class.TxCreateObject) return
    const createTx = tx as TxCreateObject<Class<Obj>>
    if (createTx.objectClass !== core.class.Class) return
    const _id = createTx.objectId as Ref<Class<Obj>>
    this.classes.set(_id, createTx.attributes)
    this.addExtends(_id)
  }

  isDerived<T extends Obj>(_class: Ref<Class<T>>, from: Ref<Class<T>>): boolean {
    let cl: Ref<Class<Obj>> | undefined = _class
    while (cl !== undefined) {
      if (cl === from) return true
      const attrs = this.classes.get(cl)
      cl = attrs?.extends
    }
    return false
  }

  extendsOfClass<T extends Obj>(_class: Ref<Class<T>>): Array<Ref<Class<Obj>>> {
    return this.extends.get(_class) ?? []
  }

  private addExtends<T extends Obj>(_class: Ref<Class<T>>): void {
    const hierarchy = this.getAncestors(_class as Ref<Class<Obj>>)
    for (const cls of hierarchy) {
      const list = this.extends.get(cls)
      if (list === undefined) {
        this.extends.set(cls, [_class as Ref<Class<Obj>>])
      } else if (!list.includes(_class)) {
        list.push(_class as Ref<Class<Obj>>)
      }
    }
  }
}
