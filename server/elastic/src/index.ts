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

import { Class, Hierarchy, Doc, Ref, TxProcessor, TxCreateDoc, DocumentQuery, QuerySelector, TxUpdateDoc, TxRemoveDoc, FindOptions, SortingQuery, SortingOrder, FindResult } from '@anticrm/core'
import type { Storage } from '@anticrm/core'
import { Client, RequestParams } from '@elastic/elasticsearch'

export interface ConnectionParams {
  url: string
  username: string
  password: string
}

function getSortingDirection (direction: SortingOrder | undefined): string {
  return direction === SortingOrder.Descending ? 'desc' : 'asc'
}

function toLowerCase (item: any): any {
  return typeof item === 'string' ? item.toLowerCase() : item
}

export class ElasticStorage extends TxProcessor implements Storage {
  private readonly hierarchy: Hierarchy
  private readonly client: Client
  private readonly workspace: string
  private mappingProfile: any

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

  async findAll<P extends keyof T, T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>, options?: FindOptions<T>): Promise<FindResult<T>> {
    const result: T[] = []

    const criteries = []
    for (const key in query) {
      if (key === '_id') continue
      const value = query[key]
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
        criteria.terms[key] = (value as QuerySelector<P>).$in?.map((item) => toLowerCase(item))
        criteries.push(criteria)
      }
    }

    const classes = this.hierarchy.getDescendants(_class).map((item) => toLowerCase(item))
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

    const sort = this.createSort(options?.sort)
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
        sort: sort,
        size: options?.limit ?? 1000
      }
    })

    const total = body.hits.total.value
    for (const doc of body.hits.hits) {
      result.push({ _id: doc._id, ...doc._source })
    }

    return Object.assign(result, { total })
  }

  protected async txCreateDoc (tx: TxCreateDoc<Doc>): Promise<void> {
    const { _id, ...body } = TxProcessor.createDoc2Doc(tx)
    const object: RequestParams.Index = {
      id: _id,
      index: this.workspace,
      type: this.hierarchy.getDomain(tx.objectClass),
      body: { ...body }
    }
    await this.client.index(object)
    await this.client.indices.refresh({ index: this.workspace })
  }

  protected async txUpdateDoc (tx: TxUpdateDoc<Doc>): Promise<void> {
    let script = `ctx._source.modifiedBy = '${tx.modifiedBy}';`
    script += ` ctx._source.modifiedOn = '${tx.modifiedOn}';`
    const attrs = tx.operations as any
    for (const key in attrs) {
      if (key === '$push') {
        const keyval = attrs[key]
        for (const key in keyval) {
          script += ` if (ctx._source.${key} == null) { ctx._source.${key} = ['${keyval[key]}'] } else { ctx._source.${key}.add('${keyval[key]}') }`
        }
      } else {
        script += ` ctx._source.${key} = '${attrs[key]}';`
      }
    }

    const object: RequestParams.Update = {
      id: tx.objectId,
      index: this.workspace,
      body: {
        script: {
          source: script
        }
      }
    }
    await this.client.update(object)
    await this.client.indices.refresh({ index: this.workspace })
  }

  private async createSort<T extends Doc> (sort: SortingQuery<T> | undefined): Promise<Array<Record<string, { order: string, mode: string}>> | undefined> {
    if (sort !== undefined) {
      const result: Array<Record<string, { order: string, mode: string}>> = []
      for (const key in sort) {
        const name = await this.getName(key)
        const direction = getSortingDirection(sort[key])
        result.push({ [name]: { order: direction, mode: 'max' } })
      }
      return result
    }
  }

  private async getName (key: string): Promise<string> {
    if (this.mappingProfile === undefined) {
      const mapping = await this.client.indices.getMapping()
      this.mappingProfile = mapping.body[this.workspace].mappings.properties
    }
    const data = this.mappingProfile[key]
    return data.type === 'text' ? `${key}.keyword` : key
  }

  protected async txRemoveDoc (tx: TxRemoveDoc<Doc>): Promise<void> {
    const object: RequestParams.Delete = {
      id: tx.objectId,
      index: this.workspace,
      type: this.hierarchy.getDomain(tx.objectClass)
    }
    await this.client.delete(object)
    await this.client.indices.refresh({ index: this.workspace })
  }
}
