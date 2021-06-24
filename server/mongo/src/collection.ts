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
import {
  Class,
  Doc,
  Emb,
  generateId,
  Hierarchy,
  makeEmb,
  Obj,
  Ref,
  TxAddCollection,
  TxUpdateCollection
} from '@anticrm/core'
import { FilterQuery } from 'mongodb'
import mongoIds from './component'
import { CollectionItemDoc, ItemQuery } from './model'

/**
 * Construct document to store collection item.
 * @param tx
 * @returns
 */
export function createEmb2Doc<T extends Doc, P extends Emb> (tx: TxAddCollection<T, P>): CollectionItemDoc<T, P> {
  const localId = tx.localId ?? generateId()
  const item: CollectionItemDoc<T, P> = {
    _class: mongoIds.class.CollectionItemDoc,
    _id: `${tx.objectId}-${localId}` as Ref<CollectionItemDoc<T, P>>,
    localId: localId,
    objectId: tx.objectId,
    collection: tx.collection,
    space: tx.objectSpace,
    value: makeEmb(tx.itemClass, tx.attributes),
    modifiedBy: tx.modifiedBy,
    modifiedOn: tx.modifiedOn
  }
  return item
}

/**
 * Construct mongo collection item query
 * @param tx - update transaction.
 * @returns
 */
export function toMongoItemIdQuery<T extends Doc, P extends Emb> (
  tx: TxUpdateCollection<T, P>
): FilterQuery<CollectionItemDoc<T, P>> {
  return {
    _class: mongoIds.class.CollectionItemDoc,
    _id: `${tx.objectId}-${tx.localId}` as Ref<CollectionItemDoc<T, P>>,
    localId: tx.localId,
    space: tx.objectSpace,
    collection: tx.collection,
    'value._class': tx.itemClass,
    objectId: tx.objectId
  }
}

/**
 * Convert an Emb object values to `value.{key}` format to allow mongo query.
 * @param values
 * @returns
 */
export function toMongoItemValue<P extends Emb> (values: Partial<Omit<P, keyof Emb>>): Record<string, any> {
  return Object.assign({}, ...Array.from(Object.entries(values), ([k, v]) => ({ ['value.' + k]: v })))
}

/**
 * Creates a an item collection query with filled class properly set.
 **
 * @param objectClass - a class query is designed for.
 * @param query - a query object to convert to.
 */
export function toMongoItemQuery<T extends Doc, P extends Emb> (
  hierarchy: Hierarchy,
  itemQuery: ItemQuery<T, P>,
  query: Partial<P>
): FilterQuery<CollectionItemDoc<T, P>> {
  const mongoQuery: FilterQuery<CollectionItemDoc<Doc, P>> = {
    objectId: itemQuery.objectId,
    collection: itemQuery.collection,
    ...toMongoItemValue<P>(query),
    'value._class': itemQuery.itemClass
  }
  if (itemQuery.localId !== undefined) {
    mongoQuery.localId = itemQuery.localId
  }

  const classes: Ref<Class<Obj>>[] = [itemQuery.itemClass]

  const byClass = hierarchy.getDescendants(itemQuery.itemClass)
  // We need find for all classes extending our own.
  classes.push(...byClass)

  // Find by all classes.
  if (classes.length > 1) {
    mongoQuery['value._class'] = { $in: classes.map((cl) => cl) }
  }
  return mongoQuery as FilterQuery<CollectionItemDoc<T, P>>
}
