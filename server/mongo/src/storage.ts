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
  Hierarchy,
  Ref,
  Storage,
  Tx,
  TxCreateDoc,
  TxProcessor,
  TxUpdateDoc,
  TxRemoveDoc
} from '@anticrm/core'
import { Collection, Db, UpdateQuery, FilterQuery } from 'mongodb'
import { toMongoIdQuery, toMongoQuery } from './query'

/**
 * Document storage based on MongoDB
 */
export class DocStorage extends TxProcessor implements Storage {
  txHandlers = {
    [core.class.TxCreateDoc]: async (tx: Tx) => await this.txCreateDoc(tx as TxCreateDoc<Doc>),
    [core.class.TxUpdateDoc]: async (tx: Tx) => await this.txUpdateDoc(tx as TxUpdateDoc<Doc>),
    [core.class.TxRemoveDoc]: async (tx: Tx) => await this.txRemoveDoc(tx as TxRemoveDoc<Doc>)
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

  async txCreateDoc (tx: TxCreateDoc<Doc>): Promise<void> {
    await this.collection(tx.objectClass).insertOne(TxProcessor.createDoc2Doc(tx))
  }

  async txUpdateDoc (tx: TxUpdateDoc<Doc>): Promise<any> {
    const { $push, ...leftAttrs } = tx.operations
    const op: UpdateQuery<Doc> = {
      $set: {
        ...leftAttrs,
        modifiedBy: tx.modifiedBy,
        modifiedOn: tx.modifiedOn
      }
    }
    if ($push !== undefined) {
      op.$push = $push
    }
    return await this.collection(tx.objectClass).updateOne(toMongoIdQuery(tx), op)
  }

  async txRemoveDoc (tx: TxRemoveDoc<Doc>): Promise<void> {
    const deleteQuery: FilterQuery<Doc> = {
      _id: tx.objectId,
      _class: tx.objectClass,
      space: tx.objectSpace
    }
    await this.collection(tx.objectClass).deleteOne(deleteQuery)
  }

  async findAll<T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>): Promise<T[]> {
    const mongoQuery = toMongoQuery(this.hierarchy, _class, query)
    return await this.collection(_class).find(mongoQuery).toArray()
  }
}
