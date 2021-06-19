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

import { Class, Hierarchy, Doc, DocumentQuery, Collection, generateId, Ref, Emb, TxProcessor, TxAddCollection, TxCreateDoc, QuerySelector } from '@anticrm/core'
import type { Storage } from '@anticrm/core'
import { Client, RequestParams } from '@elastic/elasticsearch'

export interface ConnectionParams {
  url: string
  username: string
  password: string
}

export class ElasticStorage extends TxProcessor implements Storage {
  private readonly hierarchy: Hierarchy
  private readonly client: Client
  private readonly workspace: string

  constructor (hierarchy: Hierarchy, workspace: string, connection: ConnectionParams) {
    super()
    this.hierarchy = hierarchy
    this.workspace = workspace
    this.client = new Client({
      node: connection.url,
      auth: {
        username: connection.username,
        password: connection.password
      }
    })
  }

  private async objectById<T extends Doc>(_id: Ref<T>): Promise<T> {
    const request = {
      index: this.workspace,
      id: _id
    }
    const { body } = await this.client.get(request)

    return { _id: body._id, ...body._source }
  }

  async findAll<T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>): Promise<T[]> {
    const result: T[] = []

    const criteries = []
    for (const key in query) {
      if (key === '_id') continue
      const value = (query as any)[key]
      if (typeof value === 'string') {
        const criteria = {
          match: Object()
        }
        criteria.match[key] = value
        criteries.push(criteria)
      } else {
        const criteria = {
          terms: Object()
        }
        criteria.terms[key] = (value as QuerySelector<any>).$in?.map((item: any) => typeof item === 'string' ? item.toLowerCase() : item)
        criteries.push(criteria)
      }
    }

    const classes = this.hierarchy.getDescendants(_class).map((item) => typeof item === 'string' ? item.toLowerCase() : item)
    const criteria = {
      terms: Object()
    }
    criteria.terms._class = classes
    criteries.push(criteria)

    const domain = this.hierarchy.getDomain(_class)
    const docQuery = query as DocumentQuery<Doc>

    let filter
    if (docQuery._id !== undefined) {
      filter = {
        ids: {
          values: typeof docQuery._id === 'string' ? [docQuery._id] : docQuery._id.$in
        }
      }
    }

    const { body } = await this.client.search({
      index: this.workspace,
      type: domain,
      body: {
        query: {
          bool: {
            must: criteries,
            filter: filter
          }
        },
        size: 1000
      }
    })

    for (const doc of body.hits.hits) {
      result.push({ _id: doc._id, ...doc._source })
    }

    return result
  }

  protected async txCreateDoc (tx: TxCreateDoc<Doc>): Promise<void> {
    const object: RequestParams.Index = {
      id: tx.objectId,
      index: this.workspace,
      type: this.hierarchy.getDomain(tx.objectClass),
      body: { _class: tx.objectClass, space: tx.objectSpace, ...tx.attributes }
    }
    await this.client.index(object)
    await this.client.indices.refresh({ index: this.workspace })
  }

  protected async txAddCollection (tx: TxAddCollection<Doc, Emb>): Promise<void> {
    const doc = await this.objectById(tx.objectId)
    if ((doc as any)[tx.collection] === undefined) {
      (doc as any)[tx.collection] = {} as Collection<Emb> // eslint-disable-line @typescript-eslint/consistent-type-assertions
    }
    const collection = (doc as any)[tx.collection]
    collection[tx.localId ?? generateId()] = tx.attributes

    const { _id, ...data } = doc
    const object = {
      id: tx.objectId,
      index: this.workspace,
      type: tx.itemClass,
      body: data
    }
    await this.client.index(object)
    await this.client.indices.refresh({ index: this.workspace })
  }
}
