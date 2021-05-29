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

import type { Obj, Doc, Ref, Class, Tx, TxCreateObject, Data } from '@anticrm/core'
import { DOMAIN_TX } from '@anticrm/core'
import { Model, Builder } from '@anticrm/model'

import core from './component'

@Model(core.class.Obj, core.class.Obj)
class TObj implements Obj {
  _class!: Ref<Class<this>>
}

@Model(core.class.Doc, core.class.Obj)
export class TDoc extends TObj implements Doc {
  _id!: Ref<this>
}

@Model(core.class.Tx, core.class.Doc, DOMAIN_TX)
export class TTx extends TDoc implements Tx {
  domain!: string
  objectId!: Ref<Doc>
}

@Model(core.class.TxCreateObject, core.class.Tx)
export class TTxCreateObject<T extends Doc> extends TTx implements TxCreateObject<T> {
  objectClass!: Ref<Class<T>>
  attributes!: Data<T>
}

export function createModel(builder: Builder) {
  builder.createModel(TObj, TDoc, TTx, TTxCreateObject)
}

export { core as default }
