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
  Class,
  Client,
  Doc,
  DocumentQuery,
  FindOptions,
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
  TxUpdateDoc
} from '@anticrm/core'

interface Query {
  _id: string
  _class: Ref<Class<Doc>>
  query: DocumentQuery<Doc>
  result: Doc[] | Promise<Doc[]>
  total: number
  options?: FindOptions<Doc>
  callback: (result: FindResult<Doc>) => void
}

export interface Queriable {
  query: <T extends Doc>(
    _class: Ref<Class<T>>,
    query: DocumentQuery<T>,
    callback: (result: T[]) => void,
    options?: FindOptions<T>
  ) => () => void

  notifyTx: (tx: Tx) => Promise<void>
}

export class LiveQuery extends TxProcessor implements Storage, Queriable {
  private readonly queries: Map<string, Query> = new Map<string, Query>()
  private readonly qid = generateId()

  constructor (readonly client: Client) {
    super()
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
      if ((doc as any)[key] !== value) {
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
    callback: (result: T[]) => void,
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
      callback: callback as (result: Doc[]) => void
    }
    this.queries.set(q._id, q)
    result
      .then((result) => {
        q.callback(result)
      })
      .catch((err) => {
        console.log('failed to update Live Query: ', err)
      })

    return () => {
      this.queries.delete(q._id)
    }
  }

  async txUpdateDoc (tx: TxUpdateDoc<Doc>): Promise<void> {
    for (const q of this.queries.values()) {
      if (q.result instanceof Promise) {
        q.result = await q.result
      }
      const updatedDoc = q.result.find((p) => p._id === tx.objectId)
      if (updatedDoc !== undefined) {
        await this.doUpdateDoc(updatedDoc, tx)
        this.sort(q, tx)
        await this.callback(updatedDoc, q)
      }
    }
  }

  async txCreateDoc (tx: TxCreateDoc<Doc>): Promise<void> {
    for (const q of this.queries.values()) {
      const doc = TxProcessor.createDoc2Doc(tx)
      if (this.match(q, doc)) {
        if (q.result instanceof Promise) {
          q.result = await q.result
        }
        q.result.push(doc)
        q.total++

        if (q.options?.sort !== undefined) resultSort(q.result, q.options?.sort)

        if (q.options?.limit !== undefined && q.result.length > q.options.limit) {
          if (q.result.pop()?._id !== doc._id) {
            q.callback(Object.assign(q.result, { total: q.total }))
          }
        } else {
          q.callback(Object.assign(q.result, { total: q.total }))
        }
      }
    }
  }

  async txRemoveDoc (tx: TxRemoveDoc<Doc>): Promise<void> {
    for (const q of this.queries.values()) {
      if (q.result instanceof Promise) {
        q.result = await q.result
      }
      const index = q.result.findIndex((p) => p._id === tx.objectId)
      if (index > -1) {
        q.result.splice(index, 1)
        q.callback(Object.assign(q.result, { total: --q.total }))
      }
    }
  }

  async tx (tx: Tx): Promise<void> {
    await this.client.tx(tx)
    await this.notifyTx(tx)
  }

  async notifyTx (tx: Tx): Promise<void> {
    await super.tx(tx)
  }

  async doUpdateDoc (updatedDoc: Doc, tx: TxUpdateDoc<Doc>): Promise<void> {
    const ops = tx.operations as any
    for (const key in ops) {
      if (key.startsWith('$')) {
        const operator = getOperator(key)
        operator(updatedDoc, ops[key])
      } else {
        ;(updatedDoc as any)[key] = ops[key]
      }
    }
    updatedDoc.modifiedBy = tx.modifiedBy
    updatedDoc.modifiedOn = tx.modifiedOn
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

  async callback (updatedDoc: Doc, q: Query): Promise<void> {
    q.result = q.result as Doc[]

    if (q.options?.limit !== undefined && q.result.length > q.options.limit) {
      if (q.result[q.options?.limit]._id === updatedDoc._id) {
        const res = await this.findAll(q._class, q.query, q.options)
        q.result = res
        q.total = res.total
        q.callback(res)
        return
      }
      if (q.result.pop()?._id !== updatedDoc._id) q.callback(Object.assign(q.result, { total: q.total }))
    } else {
      q.callback(Object.assign(q.result, { total: q.total }))
    }
  }
}
