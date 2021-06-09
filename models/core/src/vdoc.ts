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

import { Account, Emb, Ref, Space, TxAddVDocCollection, TxCreateVDoc, TxUpdateVDoc, TxUpdateVDocCollection, VDoc } from '@anticrm/core'
import { Model } from '@anticrm/model'
import core from './component'
import { TTxAddCollection, TTxCreateDoc, TTxUpdateCollection, TTxUpdateDoc } from './tx'

// V D O C --- T R A N S A C T I O N S

@Model(core.class.TxCreateVDoc, core.class.Tx)
export class TTxCreateVDoc<T extends VDoc> extends TTxCreateDoc<T, VDoc> implements TxCreateVDoc<T> {
  objectSpace!: Ref<Space>
  objectUser!: Ref<Account>
  timestamp!: number
}

@Model(core.class.TxUpdateVDoc, core.class.Tx)
export class TTxUpdateVDoc<T extends VDoc> extends TTxUpdateDoc<T, VDoc> implements TxUpdateVDoc<T> {
  objectSpace!: Ref<Space>
  objectUser!: Ref<Account>
  timestamp!: number
}

@Model(core.class.TxAddVDocCollection, core.class.TxAddCollection)
export class TTxAddVDocCollection<T extends VDoc, C extends Emb> extends TTxAddCollection<T, C> implements TxAddVDocCollection<T, C> {
  objectSpace!: Ref<Space>
  objectUser!: Ref<Account>
  timestamp!: number
}

@Model(core.class.TxUpdateVDocCollection, core.class.TxUpdateCollection)
export class TTxUpdateVDocCollection<T extends VDoc, C extends Emb> extends TTxUpdateCollection<T,C> implements TxUpdateVDocCollection<T, C> {
  objectSpace!: Ref<Space>
  objectUser!: Ref<Account>
  timestamp!: number
}
