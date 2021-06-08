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

import type { Doc, Emb, Ref } from './classes'
import { Account, Space } from './security'
import { TxAddCollection, TxCreateDoc, TxUpdateCollection, TxUpdateDoc } from './tx'

/**
 * Define user versioned document.
 */
export interface VDoc extends Doc {
  space: Ref<Space>
  createdOn: number
  createdBy: Ref<Account>
  modifiedOn?: number
  modifiedBy?: Ref<Account>
}

export interface TxSecurityContext {
  objectSpace: Ref<Space>
  objectUser: Ref<Account> // A user created object

  timestamp: number // transaction time.
}

/**
 * Create a VDoc.
 */
export interface TxCreateVDoc<T extends VDoc> extends TxCreateDoc<T, VDoc>, TxSecurityContext {
}

/**
 * Update VDoc attributes.
 */
export interface TxUpdateVDoc<T extends VDoc> extends TxUpdateDoc<T, VDoc>, TxSecurityContext {
}

/**
 * Add item to VDoc embedded collection.
 *
 * If localId is missing it will be assigned.
 */
export interface TxAddVDocCollection<T extends VDoc, P extends Emb> extends TxAddCollection<T, P>, TxSecurityContext {
}

/**
 * Update atribute inside VDoc embedded collection.
 *
 * localId is used to identify collection item.
 */
export interface TxUpdateVDocCollection<T extends VDoc, P extends Emb> extends TxUpdateCollection<T, P>, TxSecurityContext{
}
