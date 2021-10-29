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
  FindOptions,
  FindResult,
  Hierarchy,
  isDerivedDataTx,
  measure,
  measureAsync,
  Ref,
  Storage,
  Tx,
  TxCreateDoc,
  txObjectClass,
  TxProcessor,
  TxRemoveDoc,
  TxUpdateDoc
} from '@anticrm/core'
import { PlatformError, Severity, Status } from '@anticrm/status'
import { Collection, Db, FilterQuery, UpdateQuery } from 'mongodb'
import { mongoReplaceNulls } from './escaping'
import { toMongoIdQuery, toMongoQuery } from './query'

/**
 * Document storage based on MongoDB
 * @public
 */
export class DocStorage extends TxProcessor implements Storage {
  txHandlers = {
    [core.class.TxCreateDoc]: async (tx: Tx) => await this.txCreateDoc(tx as TxCreateDoc<Doc>),
    [core.class.TxUpdateDoc]: async (tx: Tx) => await this.txUpdateDocWith(tx as TxUpdateDoc<Doc>),
    [core.class.TxRemoveDoc]: async (tx: Tx) => await this.txRemoveDoc(tx as TxRemoveDoc<Doc>)
  }

  constructor (readonly db: Db, readonly hierarchy: Hierarchy) {
    super()
    this.db = db
    this.hierarchy = hierarchy
  }

  async tx (tx: Tx): Promise<void> {
    return await measureAsync(
      'mongo.tx',
      async () => await this.txHandlers[tx._class]?.(tx),
      tx._class,
      txObjectClass(tx) ?? '0'
    )
  }

  private collection<T extends Doc>(_class: Ref<Class<T>>): Collection {
    const domain = this.hierarchy.getDomain(_class)
    return this.db.collection(domain)
  }

  async txCreateDoc (tx: TxCreateDoc<Doc>): Promise<void> {
    try {
      await this.collection(tx.objectClass).insertOne(TxProcessor.createDoc2Doc(tx))
    } catch (err: any) {
      // Convert error to platform known ones.
      if (err.code === 11000) {
        console.error(err)
        // Duplicate code error
        throw new PlatformError(new Status(Severity.ERROR, core.status.ObjectAlreadyExists, { _id: tx.objectId }))
      }
    }
  }

  async txUpdateDocWith (tx: TxUpdateDoc<Doc>): Promise<any> {
    const { $push, $pull, ...leftAttrs } = tx.operations
    const op: UpdateQuery<Doc> = {}

    if (Object.keys(leftAttrs).length > 0) {
      op.$set = { ...leftAttrs }
    }

    const updateQuery = toMongoIdQuery(tx)

    if (!isDerivedDataTx(tx, this.hierarchy)) {
      // If not DD, we need update modified by and on
      op.$set = {
        ...leftAttrs,
        modifiedBy: tx.modifiedBy,
        modifiedOn: tx.modifiedOn
      }
    } else {
      // We need to remove space, since it is DD update.
      delete updateQuery.space
    }

    if ($push !== undefined) {
      op.$push = $push
    }
    if ($pull !== undefined) {
      op.$pull = $pull
    }
    return await this.collection(tx.objectClass).updateOne(updateQuery, op)
  }

  async txRemoveDoc (tx: TxRemoveDoc<Doc>): Promise<void> {
    const deleteQuery: FilterQuery<Doc> = {
      _id: tx.objectId,
      _class: tx.objectClass,
      space: tx.objectSpace
    }
    await await this.collection(tx.objectClass).deleteOne(deleteQuery)
  }

  async findAll<T extends Doc>(
    _class: Ref<Class<T>>,
    query: DocumentQuery<T>,
    options?: FindOptions<T>
  ): Promise<FindResult<T>> {
    const done = await measure('mongo.findAll', _class)
    const mongoQuery = toMongoQuery(this.hierarchy, _class, query)
    let cursor = this.collection(_class).find(mongoQuery)
    if (options?.sort !== undefined) {
      cursor = cursor.sort(options.sort)
    }

    if (options?.skip !== undefined && options?.skip > 0) {
      cursor = cursor.skip(options.skip)
    }

    const total = await cursor.count()
    if (options?.limit !== undefined) cursor = cursor.limit(options.limit)
    const result = Object.assign((await cursor.toArray()).map(mongoReplaceNulls), { total })
    done()
    return result
  }
}
