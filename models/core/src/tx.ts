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

import type {
  Class,
  Data,
  Doc,
  DocumentUpdate,
  Ref,
  Space,
  Tx,
  TxCreateDoc,
  TxRemoveDoc,
  TxUpdateDoc,
  TransactionID
} from '@anticrm/core'
import { DOMAIN_TX } from '@anticrm/core'
import { Model } from '@anticrm/model'
import core from './component'
import { TDoc } from './core'

// T R A N S A C T I O N S

/**
 * @public
 */
@Model(core.class.Tx, core.class.Doc, DOMAIN_TX)
export class TTx<T extends Doc> extends TDoc implements Tx<T> {
  sid!: TransactionID
  objectId!: Ref<T>
  objectSpace!: Ref<Space>
}

/**
 * @public
 */
@Model(core.class.TxCreateDoc, core.class.Tx)
export class TTxCreateDoc<T extends Doc> extends TTx<T> implements TxCreateDoc<T> {
  objectClass!: Ref<Class<T>>
  attributes!: Data<T>
}

/**
 * @public
 */
@Model(core.class.TxUpdateDoc, core.class.Tx)
export class TTxUpdateDoc<T extends Doc> extends TTx<T> implements TxUpdateDoc<T> {
  objectClass!: Ref<Class<T>>
  operations!: DocumentUpdate<T>
}

/**
 * @public
 */
@Model(core.class.TxRemoveDoc, core.class.Tx)
export class TTxRemoveDoc<T extends Doc> extends TTx<T> implements TxRemoveDoc<T> {
  objectClass!: Ref<Class<T>>
}
