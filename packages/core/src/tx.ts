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

import type { Class, Data, Doc, Domain, Emb, Ref, Account, Space } from './classes'
import core from './component'
import { generateId } from './utils'

export interface Tx<T extends Doc = Doc> extends Doc {
  objectId: Ref<T>
  objectSpace: Ref<Space>
}

export interface TxCreateDoc<T extends Doc> extends Tx<T> {
  objectClass: Ref<Class<T>>
  attributes: Data<T>
}

export interface TxUpdateDoc<T extends Doc> extends Tx<T> {
  objectClass: Ref<Class<T>>
  attributes: Partial<Data<T>>
}

export interface TxAddCollection<T extends Doc, P extends Emb> extends Tx<T> {
  collection: string
  itemClass: Ref<Class<P>>
  localId?: string
  attributes: Omit<P, keyof Emb>
}

export interface TxUpdateCollection<T extends Doc, P extends Emb> extends Tx<T> {
  collection: string
  itemClass: Ref<Class<P>>
  localId: string
  attributes: Partial<Omit<P, keyof Emb>>
}

export const DOMAIN_TX = 'tx' as Domain

export class TxProcessor {
  async tx (tx: Tx): Promise<void> {
    switch (tx._class) {
      case core.class.TxCreateDoc:
        return await this.txCreateDoc(tx as TxCreateDoc<Doc>)
      case core.class.TxAddCollection:
        return await this.txAddCollection(tx as TxAddCollection<Doc, Emb>)
    }
  }

  static createDoc2Doc (tx: TxCreateDoc<Doc>): Doc {
    return {
      _id: tx.objectId,
      _class: tx.objectClass,
      space: tx.objectSpace,
      modifiedBy: tx.modifiedBy,
      modifiedOn: tx.modifiedOn,
      ...tx.attributes
    }
  }

  protected async txCreateDoc (tx: TxCreateDoc<Doc>): Promise<void> {}
  protected async txAddCollection (tx: TxAddCollection<Doc, Emb>): Promise<void> {}
}

export class TxOperations extends TxProcessor {
  constructor (readonly user: Ref<Account>) {
    super()
  }

  async createDoc<T extends Doc>(_class: Ref<Class<T>>, space: Ref<Space>, attributes: Data<T>): Promise<void> {
    const tx: TxCreateDoc<T> = {
      _id: generateId(),
      _class: core.class.TxCreateDoc,
      space: core.space.Tx,
      modifiedBy: this.user,
      modifiedOn: Date.now(),
      objectId: generateId(),
      objectClass: _class,
      objectSpace: space,
      attributes
    }
    return await this.tx(tx)
  }
}
