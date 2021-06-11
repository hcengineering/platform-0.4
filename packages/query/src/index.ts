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

import { Ref, Class, Doc, Tx, DocumentQuery, TxCreateDoc, Client, Obj, TxOperations } from '@anticrm/core'
import { TxProcessor } from '@anticrm/core'

type Query = {
  _class: Ref<Class<Doc>>
  query: DocumentQuery<Doc>
  callback: (result: Doc[]) => void
}

export class LiveQuery extends TxOperations implements Client {
  private readonly cache: Map<Query, Doc[]> = new Map<Query, Doc[]>()
  private readonly client: Client
  private readonly queries: Query[] = []

  constructor (client: Client) {
    super (client.user)
    this.client = client
  }

  isDerived<T extends Obj>(_class: Ref<Class<T>>, from: Ref<Class<T>>): boolean {
    return this.client.isDerived(_class, from)
  }

  private match(q: Query, tx: TxCreateDoc<Doc>): boolean {
    if (this.isDerived(tx.objectClass, q._class) === false) {
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

  private cacheCreateDoc<T extends Doc>(query: Query, object: T): void {
    const values = this.cache.get(query) || []
    const index = values.findIndex((doc) => doc._id === object._id)
    if (index === -1) {
      values.push(object)
    } else {
      values[index] = object
    }
  }

  private refresh(query: Query): void {
    const result = this.cache.get(query) || []
    query.callback(result)
  }

  findAll<T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>): Promise<T[]> {
    return this.client.findAll(_class, query)
  }

  query<T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>, callback: (result: T[]) => void): () => void {
    const q: Query = { _class, query, callback: callback as (result: Doc[]) => void }
    this.queries.push(q)
    this.client.findAll(_class, query).then((result) => {
      this.cache.set(q, result)
      q.callback(result)
    })
    return () => { 
      this.queries.splice(this.queries.indexOf(q)) 
      this.cache.delete(q)
    }
  }

  async txCreateDoc(tx: TxCreateDoc<Doc>): Promise<void> {
    for (const q of this.queries) {
      if (this.match(q, tx)) {
        const doc = TxProcessor.createDoc2Doc(tx)
        this.cacheCreateDoc(q, doc)
        this.refresh(q)
      }
    }
  }

  async tx(tx: Tx): Promise<void> {
    await this.client.tx(tx)
    return super.tx(tx)
  }
}
