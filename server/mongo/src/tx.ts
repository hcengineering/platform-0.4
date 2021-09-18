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

import { Class, DocumentQuery, FindOptions, FindResult, Hierarchy, Storage, Tx } from '@anticrm/core'
import { Doc, Ref } from '@anticrm/core/src/classes'
import { Collection } from 'mongodb'
import { mongoEscape, mongoReplaceNulls, mongoUnescape } from './escaping'
import { toMongoQuery } from './query'

/**
 * Transaction storage based on MongoDB
 * @public
 */
export class TxStorage implements Storage {
  constructor (readonly db: Collection, readonly hierarchy: Hierarchy) {
    this.db = db
    this.hierarchy = hierarchy
  }

  async tx (tx: Tx): Promise<void> {
    await this.db.insertOne(mongoEscape(tx))
  }

  async findAll<T extends Doc>(
    _class: Ref<Class<T>>,
    query: DocumentQuery<T>,
    options?: FindOptions<T>
  ): Promise<FindResult<T>> {
    const mongoQuery = toMongoQuery(this.hierarchy, _class, query)
    let cursor = this.db.find(mongoQuery)
    if (options?.sort !== undefined) cursor = cursor.sort(options.sort)
    const total = await cursor.count()
    if (options?.limit !== undefined) cursor = cursor.limit(options.limit)
    const resultArray = await cursor.toArray()
    return Object.assign(resultArray.map(mongoUnescape).map(mongoReplaceNulls), { total })
  }
}
