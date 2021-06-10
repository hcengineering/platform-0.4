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

import { Class, Hierarchy, Doc, Data, Collection, generateId, Ref, Emb, TxProcessor, TxAddCollection, TxCreateDoc } from '@anticrm/core'
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

  async findAll<T extends Doc>(_class: Ref<Class<T>>, query: Partial<Data<T>> & Partial<Doc>): Promise<T[]> {
    const result: T[] = []

    const criteries = []
    for (const key in query) {
      const value = (query as any)[key]
      const criteria = {
        match: Object()
      }
      criteria.match[key] = value
      criteries.push(criteria)
    }

    const classes = []
    const children = this.hierarchy.getDescendants(_class)
    for (const value of children) {
      const criteria = {
        match: Object()
      }
      criteria.match._class = value
      classes.push(criteria)
    }

    const domain = this.hierarchy.getDomain(_class)

    const { body } = await this.client.search({
      index: this.workspace,
      type: domain,
      body: {
        query: {
          bool: {
            must: criteries,
            should: classes,
            minimum_should_match: 1
          }
        }
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
      type: tx.domain,
      body: { _class: tx.objectClass, ...tx.attributes }
    }
    await this.client.index(object)
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
      type: tx.domain,
      body: data
    }
    await this.client.index(object)
  }
}
