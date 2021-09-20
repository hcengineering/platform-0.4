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

import {
  Account,
  Class,
  Client,
  Doc,
  DocumentQuery,
  FileOp,
  FindOptions,
  findProperty,
  FindResult,
  generateId,
  getOperator,
  Obj,
  Ref,
  resultSort,
  SortingQuery,
  Storage,
  Tx,
  TxCreateDoc,
  TxProcessor,
  TxRemoveDoc,
  TxUpdateDoc,
  WithFiles
} from '@anticrm/core'
import copy from 'fast-copy'

interface Query {
  _id: string
  _class: Ref<Class<Doc>>
  query: DocumentQuery<Doc>
  result: Doc[] | Promise<FindResult<Doc>>
  total: number
  options?: FindOptions<Doc>
  callback: (result: FindResult<Doc>) => void
}

/**
 * @public
 */
export interface Queriable {
  query: <T extends Doc>(
    _class: Ref<Class<T>>,
    query: DocumentQuery<T>,
    callback: (result: FindResult<T>) => void,
    options?: FindOptions<T>
  ) => () => void

  notifyTx: (tx: Tx) => Promise<void>
}

/**
 * @public
 */
export class LiveQuery extends TxProcessor implements Storage, Queriable, WithFiles {
  private readonly queries: Map<string, Query> = new Map<string, Query>()

  constructor (readonly client: Client) {
    super()
  }

  async accountId (): Promise<Ref<Account>> {
    return await this.client.accountId()
  }

  isDerived<T extends Obj>(_class: Ref<Class<T>>, from: Ref<Class<T>>): boolean {
    return this.client.isDerived(_class, from)
  }

  private match (q: Query, doc: Doc): boolean {
    if (!this.isDerived(doc._class, q._class)) {
      return false
    }
    for (const key in q.query) {
      const value = (q.query as any)[key]
      const res = findProperty([doc], key, value)
      if (res.length === 0) {
        return false
      }
    }
    return true
  }

  async findAll<T extends Doc>(
    _class: Ref<Class<T>>,
    query: DocumentQuery<T>,
    options?: FindOptions<T>
  ): Promise<FindResult<T>> {
    return await this.client.findAll(_class, query, options)
  }

  query<T extends Doc>(
    _class: Ref<Class<T>>,
    query: DocumentQuery<T>,
    callback: (result: FindResult<T>) => void,
    options?: FindOptions<T>
  ): () => void {
    const result = this.client.findAll(_class, query, options)
    const q: Query = {
      _id: generateId(),
      _class,
      query,
      result,
      total: 0,
      options,
      callback: callback as (result: FindResult<Doc>) => void
    }
    this.queries.set(q._id, q)
    result
      .then((res) => {
        q.result = copy(res)
        q.total = res.total
        q.callback(copy(res))
      })
      .catch((err) => {
        console.log('failed to update Live Query: ', err)
      })

    return () => {
      this.queries.delete(q._id)
    }
  }

  /**
   * Method to check if query had any glue to be matched with update transaction.
   */
  private matchQuery (q: Query, tx: TxUpdateDoc<Doc>): boolean {
    if (!this.isDerived(q._class, tx.objectClass)) {
      return false
    }
    for (const key in q.query) {
      const value = (q.query as any)[key]
      const res = findProperty([tx.operations as unknown as Doc], key, value)
      if (res.length === 1) {
        return true
      }
    }
    return false
  }

  async txUpdateDoc (tx: TxUpdateDoc<Doc>): Promise<void> {
    for (const q of this.queries.values()) {
      if (q.result instanceof Promise) {
        const res = await q.result
        q.result = copy(res)
        q.total = res.total
      }
      const pos = q.result.findIndex((p) => p._id === tx.objectId)
      if (pos !== -1) {
        const doc = q.result[pos]
        const updatedDoc = this.doUpdateDoc(doc, tx)
        if (!this.match(q, updatedDoc)) {
          q.result.splice(pos, 1)
          q.total--
        } else {
          q.result[pos] = updatedDoc
        }
        this.sort(q, tx)
        await this.callback(updatedDoc, q)
      } else if (this.matchQuery(q, tx)) {
        await this.refresh(q)
      }
    }
  }

  async txCreateDoc (tx: TxCreateDoc<Doc>): Promise<void> {
    const doc = TxProcessor.createDoc2Doc(tx)
    for (const q of this.queries.values()) {
      if (this.match(q, doc)) {
        if (q.result instanceof Promise) {
          const res = await q.result
          q.result = copy(res)
          q.total = res.total
        }
        q.result.push(doc)
        q.total++

        if (q.options?.sort !== undefined) resultSort(q.result, q.options?.sort)

        if (q.options?.limit !== undefined && q.result.length > q.options.limit) {
          if (q.result.pop()?._id !== doc._id) {
            q.callback(Object.assign(copy(q.result), { total: q.total }))
          }
        } else {
          q.callback(Object.assign(copy(q.result), { total: q.total }))
        }
      }
    }
  }

  async txRemoveDoc (tx: TxRemoveDoc<Doc>): Promise<void> {
    for (const q of this.queries.values()) {
      if (q.result instanceof Promise) {
        const res = await q.result
        q.result = copy(res)
        q.total = res.total
      }
      const index = q.result.findIndex((p) => p._id === tx.objectId)
      if (
        q.options?.limit !== undefined &&
        q.options.limit === q.result.length &&
        this.isDerived(q._class, tx.objectClass)
      ) {
        return await this.refresh(q)
      }
      if (index > -1) {
        q.result.splice(index, 1)
        q.callback(Object.assign(copy(q.result), { total: q.total }))
      }
    }
  }

  async tx (tx: Tx): Promise<void> {
    await this.client.tx(tx)
  }

  async notifyTx (tx: Tx): Promise<void> {
    await super.tx(tx)
  }

  async file (op: FileOp): Promise<string> {
    return await this.client.file(op)
  }

  doUpdateDoc (doc: Doc, tx: TxUpdateDoc<Doc>): Doc {
    const updatedDoc = copy(doc)
    const ops = tx.operations as any
    for (const key in ops) {
      if (key.startsWith('$')) {
        const operator = getOperator(key)
        operator(updatedDoc, ops[key])
      } else {
        ;(updatedDoc as any)[key] = copy(ops[key])
      }
    }
    updatedDoc.modifiedBy = tx.modifiedBy
    updatedDoc.modifiedOn = tx.modifiedOn
    return updatedDoc
  }

  private async refresh (q: Query): Promise<void> {
    const res = await this.client.findAll(q._class, q.query, q.options)
    q.result = copy(res)
    q.total = res.total
    q.callback(copy(res))
  }

  private sort (q: Query, tx: TxUpdateDoc<Doc>): void {
    const sort = q.options?.sort
    if (sort === undefined) return
    let needSort = sort.modifiedBy !== undefined || sort.modifiedOn !== undefined
    if (!needSort) needSort = this.checkNeedSort(sort, tx)

    if (needSort) resultSort(q.result as Doc[], sort)
  }

  private checkNeedSort (sort: SortingQuery<Doc>, tx: TxUpdateDoc<Doc>): boolean {
    const ops = tx.operations as any
    for (const key in ops) {
      if (key.startsWith('$')) {
        for (const opKey in ops[key]) {
          if (opKey in sort) return true
        }
      } else {
        if (key in sort) return true
      }
    }
    return false
  }

  private async callback (updatedDoc: Doc, q: Query): Promise<void> {
    q.result = q.result as Doc[]

    if (q.options?.limit !== undefined && q.total > q.options.limit) {
      if (q.result.pop()?._id === updatedDoc._id) {
        return await this.refresh(q)
      }
    }
    q.callback(Object.assign(copy(q.result), { total: q.total }))
  }
}
