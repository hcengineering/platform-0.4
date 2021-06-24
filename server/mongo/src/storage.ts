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

import core, {
  Class,
  Doc,
  DocumentQuery,
  Emb,
  Hierarchy,
  Ref,
  Storage,
  Tx,
  TxAddCollection,
  TxCreateDoc,
  TxProcessor,
  TxUpdateCollection,
  TxUpdateDoc
} from '@anticrm/core'
import { Collection, Db } from 'mongodb'
import { createEmb2Doc, toMongoItemIdQuery, toMongoItemQuery, toMongoItemValue } from './collection'
import { ItemQuery } from './model'
import { toMongoIdQuery, toMongoQuery } from './query'

/**
 * Document storage based on MongoDB
 */
export class DocStorage extends TxProcessor implements Storage {
  txHandlers = {
    [core.class.TxCreateDoc]: async (tx: Tx) => await this.txCreateDoc(tx as TxCreateDoc<Doc>),
    [core.class.TxUpdateDoc]: async (tx: Tx) => await this.txUpdateDoc(tx as TxUpdateDoc<Doc>),
    [core.class.TxAddCollection]: async (tx: Tx) => await this.txAddCollection(tx as TxAddCollection<Doc, Emb>),
    [core.class.TxUpdateCollection]: async (tx: Tx) => await this.txUpdateCollection(tx as TxUpdateCollection<Doc, Emb>)
  }

  constructor (readonly db: Db, readonly hierarchy: Hierarchy) {
    super()
    this.db = db
    this.hierarchy = hierarchy
  }

  async tx (tx: Tx): Promise<void> {
    const handler = this.txHandlers[tx._class]
    await handler?.(tx)
    return await Promise.resolve()
  }

  private collection<T extends Doc>(_class: Ref<Class<T>>): Collection {
    const domain = this.hierarchy.getDomain(_class)
    return this.db.collection(domain)
  }

  private collectionOfItem<T extends Emb>(itemClass: Ref<Class<T>>): Collection {
    return this.db.collection(this.hierarchy.getDomain(itemClass) + '-' + 'collections')
  }

  async txCreateDoc (tx: TxCreateDoc<Doc>): Promise<void> {
    await this.collection(tx.objectClass).insertOne(TxProcessor.createDoc2Doc(tx))
  }

  async txUpdateDoc (tx: TxUpdateDoc<Doc>): Promise<any> {
    return await this.collection(tx.objectClass).updateOne(toMongoIdQuery(tx), {
      $set: {
        ...tx.attributes,
        modifiedBy: tx.modifiedBy,
        modifiedOn: tx.modifiedOn
      }
    })
  }

  async txAddCollection (tx: TxAddCollection<Doc, Emb>): Promise<void> {
    await this.collectionOfItem(tx.itemClass).insertOne(createEmb2Doc(tx))
  }

  async txUpdateCollection (tx: TxUpdateCollection<Doc, Emb>): Promise<any> {
    const mongoQuery = toMongoItemIdQuery(tx)
    return await this.collectionOfItem(tx.itemClass).updateOne(mongoQuery, {
      $set: {
        ...toMongoItemValue(tx.attributes),
        modifiedBy: tx.modifiedBy,
        modifiedOn: tx.modifiedOn
      }
    })
  }

  async findAll<T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>): Promise<T[]> {
    const mongoQuery = toMongoQuery(this.hierarchy, _class, query)
    return await this.collection(_class).find(mongoQuery).toArray()
  }

  // Non finalized API to search for collection items.
  async findIn<T extends Doc, P extends Emb>(itemQuery: ItemQuery<T, P>, query: Partial<P>): Promise<P[]> {
    const mongoQuery = toMongoItemQuery(this.hierarchy, itemQuery, query)
    return (await this.collectionOfItem(itemQuery.itemClass).find(mongoQuery).toArray()).map((p) => p.value)
  }
}
