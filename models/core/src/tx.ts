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

import type { Class, Data, Doc, Emb, Ref, Space, Tx, TxAddCollection, TxCreateDoc, TxUpdateCollection, TxUpdateDoc } from '@anticrm/core'
import { DOMAIN_TX } from '@anticrm/core'
import { Model } from '@anticrm/model'
import core from './component'
import { TDoc } from './core'


// T R A N S A C T I O N S

@Model(core.class.Tx, core.class.Doc, DOMAIN_TX)
export class TTx<T extends Doc> extends TDoc implements Tx<T> {
  domain!: string
  objectId!: Ref<T>  
}

@Model(core.class.TxCreateDoc, core.class.Tx)
export class TTxCreateDoc<T extends O, O extends Doc> extends TTx<T> implements TxCreateDoc<T, O> {
  objectClass!: Ref<Class<T>>
  attributes!: Data<T, O>
}

@Model(core.class.TxCreateDoc, core.class.Tx)
export class TTxUpdateDoc<T extends O, O extends Doc> extends TTx<T> implements TxUpdateDoc<T, O> {
  objectClass!: Ref<Class<T>>
  attributes!: Partial<Data<T, O>>
}

@Model(core.class.TxAddCollection, core.class.Tx)
export class TTxAddCollection<T extends Doc, P extends Emb> extends TTx<T> implements TxAddCollection<T, P> {
  collection!: string
  itemClass!: Ref<Class<P>>
  localId?: string | undefined
  attributes!: Omit<P, keyof Emb>
  objectSpace!: Ref<Space>
}
@Model(core.class.TxAddCollection, core.class.Tx)
export class TTxUpdateCollection<T extends Doc, P extends Emb> extends TTx<T> implements TxUpdateCollection<T, P> {
  collection!: string
  itemClass!: Ref<Class<P>>
  localId!: string
  attributes!: Partial<Omit<P, keyof Emb>>
  objectSpace!: Ref<Space>
}
