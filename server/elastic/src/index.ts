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

import { Class, Hierarchy, Doc, Ref, TxProcessor, TxCreateDoc, DocumentQuery, QuerySelector, TxUpdateDoc, getOperator } from '@anticrm/core'
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
    const { _id, ...body } = TxProcessor.createDoc2Doc(tx)
    await this.index(_id, tx.objectClass, body)
  }

  protected async txUpdateDoc (tx: TxUpdateDoc<Doc>): Promise<void> {
    const doc = this.objectById(tx.objectId) as any
    const attrs = tx.attributes as any
    for (const key in attrs) {
      if (key.startsWith('$')) {
        const operator = getOperator(key)
        operator(doc, attrs[key])
      } else {
        doc[key] = attrs[key]
      }
    }

    const { _id, ...body } = doc
    await this.index(_id, tx.objectClass, body)
  }

  private async index (_id: Ref<Doc>, _class: Ref<Class<Doc>>, body: Omit<Doc, '_id'>): Promise<void> {
    const object: RequestParams.Index = {
      id: _id,
      index: this.workspace,
      type: this.hierarchy.getDomain(_class),
      body: { ...body }
    }
    await this.client.index(object)
    await this.client.indices.refresh({ index: this.workspace })
  }
}
