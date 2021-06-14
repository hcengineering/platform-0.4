//
// Copyright © 2021 Anticrm Platform Contributors.
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

import { Class, Doc, Emb, Ref } from '@anticrm/core'

/**
 * A document we use to store collection item inside DB.
 */
export interface CollectionItemDoc<T extends Doc, P extends Emb> extends Doc {
  objectId: Ref<T> // A source document this item is belong to
  localId: string // An item local uniq identifier.
  collection: String // Collection field name

  value: P // A value of embedded object itself.
}

export interface ItemQuery<T extends Doc, P extends Emb> {
  objectId: Ref<T> // Source object id
  collection: string // Collection field name
  itemClass: Ref<Class<P>> // Item class

  localId?: string // Item local id
}

export * from './storage'
export * from './tx'
