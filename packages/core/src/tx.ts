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

import type { Class, Data, Doc, Domain, Emb, Ref } from './classes'
import core from './component'

export interface Tx extends Doc {
  domain: string
  objectId: Ref<Doc>
}

export interface TxCreateDoc<T extends Doc> extends Tx {
  objectClass: Ref<Class<Doc>>
  attributes: Data<T>
}

export interface TxAddCollection<T extends Emb> extends Tx {
  collection: string
  localId?: string
  attributes: T
}

export const DOMAIN_TX = 'tx' as Domain

export class TxProcessor {
  async tx (tx: Tx): Promise<void> {
    switch (tx._class) {
      case core.class.TxCreateDoc:
        return await this.txCreateDoc(tx as TxCreateDoc<Doc>)
      case core.class.TxAddCollection:
        return await this.txAddCollection(tx as TxAddCollection<Emb>)
    }
    return await Promise.resolve()
  }

  protected async txCreateDoc (tx: TxCreateDoc<Doc>): Promise<void> {}
  protected async txAddCollection (tx: TxAddCollection<Emb>): Promise<void> {}
}
