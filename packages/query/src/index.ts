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

import type { Ref, Class, Doc, Tx, DocumentQuery, TxCreateDoc, Client, Obj, TxRemoveDoc } from '@anticrm/core'
import { TxProcessor } from '@anticrm/core'

interface Query {
  _class: Ref<Class<Doc>>
  query: DocumentQuery<Doc>
  result: Doc[] | Promise<Doc[]>
  callback: (result: Doc[]) => void
}

export class LiveQuery extends TxProcessor implements Client {
  private readonly client: Client
  private readonly queries: Query[] = []

  constructor (client: Client) {
    super()
    this.client = client
  }

  isDerived<T extends Obj>(_class: Ref<Class<T>>, from: Ref<Class<T>>): boolean {
    return this.client.isDerived(_class, from)
  }

  private match (q: Query, tx: TxCreateDoc<Doc>): boolean {
    if (!this.isDerived(tx.objectClass, q._class)) {
      return false
    }
    for (const key in q.query) {
      const value = (q.query as any)[key]
      if ((tx.attributes as any)[key] !== value) {
        return false
      }
    }
    return true
  }

  async findAll<T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>): Promise<T[]> {
    return await this.client.findAll(_class, query)
  }

  query<T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>, callback: (result: T[]) => void): () => void {
    const result = this.client.findAll(_class, query)
    const q: Query = {
      _class,
      query,
      result,
      callback: callback as (result: Doc[]) => void
    }
    this.queries.push(q)
    result
      .then((result) => {
        q.callback(result)
      })
      .catch((err) => {
        console.log('failed to update Live Query: ', err)
      })
    return () => {
      this.queries.splice(this.queries.indexOf(q))
    }
  }

  async txCreateDoc (tx: TxCreateDoc<Doc>): Promise<void> {
    for (const q of this.queries) {
      if (this.match(q, tx)) {
        const doc = TxProcessor.createDoc2Doc(tx)
        if (q.result instanceof Promise) {
          q.result = await q.result
        }
        q.result.push(doc)
        q.callback(q.result)
      }
    }
  }

  async txRemoveDoc (tx: TxRemoveDoc<Doc>): Promise<void> {
    for (const q of this.queries) {
      if (q.result instanceof Promise) {
        q.result = await q.result
      }
      const index = q.result.findIndex(p => p._id === tx.objectId)
      if (index > -1) {
        q.result.splice(index, 1)
        q.callback(q.result)
      }
    }
  }

  async tx (tx: Tx): Promise<void> {
    await this.client.tx(tx)
    await super.tx(tx)
  }
}
