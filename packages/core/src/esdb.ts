//
// Copyright © 2020 Anticrm Platform Contributors.
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

import type { Storage } from './storage'
import { TxProcessor } from './storage'
import type { Emb, Doc, Ref, Class, Data, Collection } from './classes'
import type { TxAddCollection, TxCreateObject } from './tx'
import type { Hierarchy } from './hierarchy'
import { Client, RequestParams } from '@elastic/elasticsearch'
import { generateId } from './utils'

export class EsDb extends TxProcessor implements Storage {
  private readonly hierarchy: Hierarchy
  private readonly client = new Client({
    node: process.env.ES_DB_URL ?? 'http://localhost:9200',
    auth: {
      username: process.env.ES_DB_USERNAME ?? 'elastic',
      password: process.env.ES_DB_PASSWORD ?? 'changeme'
    }
  })


  constructor (hierarchy: Hierarchy) {
    super()
    this.hierarchy = hierarchy
  }

  private async objectById<T extends Doc>(_id: Ref<T>): Promise<T> {
    const request = {
      index: 'workspace',
      id: _id
    }
    const { body } = await this.client.get(request)
    
    return {_id: body._id, ...body._source}
  }
  
  async findAll<T extends Doc>(_class: Ref<Class<T>>, query: Partial<Data<T>> & Partial<Doc>): Promise<T[]> {
    const result:T[] = []

    const criteries = []
    for (const key in query) {
      const value = (query as any)[key]
      const criteria = {
        match: Object()
      }
      criteria.match[key]= value
      criteries.push(criteria)
    }

    let domain = this.hierarchy.getDomain(_class)
    
    const { body } = await this.client.search({
      index: 'workspace',
      type: domain,
      body: {
        query: {
          bool: {
            must: criteries
          }
        }
      }
    })

    for (const doc of body.hits.hits) {
      result.push({_id: doc._id, ...doc._source})
    }
    return result as T[]
  }

  protected async txCreateObject (tx: TxCreateObject<Doc>): Promise<void> {
    const object: RequestParams.Index = {
      id: tx.objectId,
      index: 'workspace',
      type: tx.domain,
      body: { _class: tx.objectClass, ...tx.attributes}
    }
    await this.client.index(object)
  }

  protected async txAddCollection (tx: TxAddCollection<Emb>): Promise<void> {
    const doc = await this.objectById(tx.objectId)
    if ((doc as any)[tx.collection] === undefined) {
      (doc as any)[tx.collection] = {} as Collection<Emb>
    }
    const collection = (doc as any)[tx.collection]
    collection[tx.localId ?? generateId()] = tx.attributes
    
    const { _id, ...data } = doc;
    const object = {
        id: tx.objectId,
        index: 'workspace',
        type: tx.domain,
        body: data
      }
    await this.client.index(object)
  }
}