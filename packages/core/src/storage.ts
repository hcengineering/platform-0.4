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

import type { Emb, Doc, Ref, Class, Data, Obj } from './classes'
import type { Tx, TxCreateObject, TxAddCollection } from './tx'

import core from './component'

export type DocumentQuery<T extends Doc> = Partial<Data<T>>

export interface Storage {
  findAll<T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>): Promise<T[]>
  tx(tx: Tx): Promise<void>
  isDerived<T extends Obj>(_class: Ref<Class<T>>, from: Ref<Class<T>>): boolean
}

export class TxProcessor {
  tx (tx: Tx): Promise<void> {
    switch(tx._class) {
      case core.class.TxCreateObject:
        return this.txCreateObject(tx as TxCreateObject<Doc>)
      case core.class.TxAddCollection:
        return this.txAddCollection(tx as TxAddCollection<Emb>)
    }
    return Promise.resolve()
  }

  protected async txCreateObject (tx: TxCreateObject<Doc>): Promise<void> {}
  protected async txAddCollection (tx: TxAddCollection<Emb>): Promise<void> {}
}
