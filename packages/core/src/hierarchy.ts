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

import type { Ref, Class, Obj, Data } from './classes'
import type { Tx, TxCreateObject } from './tx'

import core from './component'

export interface Hierarchy {
  getAncestors(_class: Ref<Class<Obj>>): Ref<Class<Obj>>[]
  tx(tx: Tx): void
}

export function createHierarchy(): Hierarchy {

  const classes = new Map<Ref<Class<Obj>>, Data<Class<Obj>>>()

  function getAncestors(_class: Ref<Class<Obj>>): Ref<Class<Obj>>[] {
    const result: Ref<Class<Obj>>[] = []
    let cl: Ref<Class<Obj>> | undefined = _class
    while (cl !== undefined) {
      result.push(cl)
      const attrs = classes.get(cl)
      cl = attrs?.extends
    }
    return result
  }

  function tx(tx: Tx): void {
    if (tx._class !== core.class.TxCreateObject) return
    const createTx = tx as TxCreateObject<Class<Obj>>
    if (createTx.objectClass !== core.class.Class) return
    const _id = createTx.objectId
    classes.set(_id as Ref<Class<Obj>>, createTx.attributes)
  }

  return { getAncestors, tx }
}
