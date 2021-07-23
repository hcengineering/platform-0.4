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

import { plugin, getPlugin, Plugin, Service } from '@anticrm/platform'
import pluginCore, { Client } from '@anticrm/plugin-core'
import {
  Doc,
  Ref,
  Class,
  Storage,
  DocumentQuery,
  FindOptions,
  Tx,
  TxOperations,
  Account,
  Space,
  Data,
  DocumentUpdate,
  FindResult
} from '@anticrm/core'
import { onDestroy } from 'svelte'
import { deepEqual } from 'fast-equals'

export type QueryUpdater<T extends Doc> = (
  _class: Ref<Class<T>>,
  query: DocumentQuery<T>,
  options?: FindOptions<T>
) => void

type UnsubscribeFunc = () => void
export interface PresentationService extends Service {}
const PluginPresentation = 'presentation' as Plugin<PresentationService>

export class PresentationClient implements Storage, TxOperations {
  private readonly client: Client

  constructor (client: Client) {
    this.client = client
  }

  static async create (): Promise<PresentationClient> {
    const plugin = await getPlugin(pluginCore.id)
    const client = await plugin.getClient()
    return new PresentationClient(client)
  }

  async findAll<T extends Doc>(
    _class: Ref<Class<T>>,
    query: DocumentQuery<T>,
    options?: FindOptions<T>
  ): Promise<FindResult<T>> {
    return await this.client.findAll(_class, query, options)
  }

  async tx (tx: Tx): Promise<void> {
    this.client.tx(tx).catch((error) => this.handleError(error))
  }

  async notifyTx (tx: Tx): Promise<void> {
    await this.client.notifyTx(tx).catch((error) => this.handleError(error))
  }

  query<T extends Doc>(
    liveQuery: QueryUpdater<T> | undefined,
    _class: Ref<Class<T>>,
    query: DocumentQuery<T>,
    callback: (result: T[]) => void,
    options?: FindOptions<T>
  ): QueryUpdater<T> {
    if (liveQuery !== undefined) {
      liveQuery(_class, query, options)
      return liveQuery
    }
    return this.liveQuery(_class, query, callback, options)
  }

  accountId (): Ref<Account> {
    return this.client.accountId()
  }

  async createDoc<T extends Doc>(
    _class: Ref<Class<T>>,
    space: Ref<Space>,
    attributes: Data<T>,
    objectId?: Ref<T>
  ): Promise<T> {
    return await this.client.createDoc(_class, space, attributes, objectId).catch((error) => {
      this.handleError(error)
      throw error
    })
  }

  async createShortRef<T extends Doc>(
    _id: Ref<T>,
    _class: Ref<Class<T>>,
    space: Ref<Space>
  ): Promise<string | undefined> {
    return await this.client.createShortRef(_id, _class, space)
  }

  async updateDoc<T extends Doc>(
    _class: Ref<Class<T>>,
    space: Ref<Space>,
    objectId: Ref<T>,
    operations: DocumentUpdate<T>
  ): Promise<void> {
    return await this.client.updateDoc(_class, space, objectId, operations).catch((error) => this.handleError(error))
  }

  async removeDoc<T extends Doc>(_class: Ref<Class<T>>, space: Ref<Space>, objectId: Ref<T>): Promise<void> {
    return await this.client.removeDoc(_class, space, objectId).catch((error) => this.handleError(error))
  }

  private liveQuery<T extends Doc>(
    _class: Ref<Class<T>>,
    query: DocumentQuery<T>,
    callback: (result: T[]) => void,
    options?: FindOptions<T>
  ): QueryUpdater<T> {
    let oldQuery: DocumentQuery<T>
    let oldClass: Ref<Class<T>>
    let oldOptions: FindOptions<T> | undefined
    let unsubscribe: UnsubscribeFunc = () => {}

    onDestroy(() => {
      unsubscribe()
    })

    const updater = (newClass: Ref<Class<T>>, newQuery: DocumentQuery<T>, options?: FindOptions<T>): void => {
      if (deepEqual(oldQuery, newQuery) && oldClass === newClass && deepEqual(oldOptions, options)) {
        return
      }

      unsubscribe()
      oldQuery = newQuery
      oldClass = newClass
      oldOptions = options
      unsubscribe = this.client.query(newClass, newQuery, callback, options)
    }

    updater(_class, query, options)

    return updater
  }

  private handleError (error: any): void {
    console.error(error)
    throw error
  }
}

export default plugin(PluginPresentation, {}, {})
