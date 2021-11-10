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

import core, {
  Account,
  Class,
  Client,
  CoreClient,
  createTestTxAndDocStorage,
  DerivedDataProcessor,
  Doc,
  DocumentQuery,
  FindOptions,
  FindResult,
  Hierarchy,
  isModelTx,
  ModelDb,
  Obj,
  Ref,
  Tx,
  TxDb,
  TxProcessor,
  withSID
} from '@anticrm/core'
import copy from 'fast-copy'

export class ClientImpl extends TxProcessor implements Client {
  handler: (tx: Tx) => void = () => {}
  constructor (
    readonly hierarchy: Hierarchy,
    readonly txModel: CoreClient,
    readonly ddProcessor: DerivedDataProcessor,
    readonly sidID: (tx: Tx) => Promise<Tx>,
    readonly model: ModelDb,
    readonly transactions: TxDb,
    readonly logging: boolean
  ) {
    super()
  }

  isDerived<T extends Obj>(_class: Ref<Class<T>>, from: Ref<Class<T>>): boolean {
    return this.hierarchy.isDerived(_class, from)
  }

  getDescendants<T extends Obj>(_class: Ref<Class<T>>): Ref<Class<Obj>>[] {
    return this.hierarchy.getDescendants(_class)
  }

  getAncestors (_class: Ref<Class<Obj>>): Ref<Class<Obj>>[] {
    return this.hierarchy.getAncestors(_class)
  }

  static async create (txes: Tx[], logging = false): Promise<ClientImpl> {
    const hierarchy = new Hierarchy()
    txes.forEach((tx) => hierarchy.tx(tx))

    const transactions = new TxDb(hierarchy)
    const model = new ModelDb(hierarchy)

    const sidID = withSID(undefined, -1)

    for (let tx of txes) {
      tx = await sidID(tx)
      await transactions.tx(tx)
      await model.tx(tx)
    }

    // This is for debug, to check for current model inside browser.
    if (logging) {
      console.info('Model Build complete', model)
    }

    const txModel: CoreClient = createTestTxAndDocStorage(hierarchy, transactions, model)

    // eslint-disable-next-line
    let clientImpl: ClientImpl

    const ddProcessor = await DerivedDataProcessor.create(model, hierarchy, {
      findAll: async (_class, query, options) => {
        return await txModel.findAll(_class, query, options)
      },
      tx: async (tx) => {
        await txModel.tx(tx)
        if (logging) {
          console.info('DD model updated', { sid: tx.sid, tx: tx, model: model })
        }
        clientImpl?.handler(tx)
      }
    })

    await ddProcessor.waitComplete()
    clientImpl = new ClientImpl(hierarchy, txModel, ddProcessor, sidID, model, transactions, logging)
    return clientImpl
  }

  async findAll<T extends Doc>(
    _class: Ref<Class<T>>,
    query: DocumentQuery<T>,
    options?: FindOptions<T>
  ): Promise<FindResult<T>> {
    return copy(await this.txModel.findAll(_class, query, options))
  }

  async tx (tx: Tx): Promise<void> {
    tx = await this.sidID(tx)
    // 1. update hierarchy
    if (isModelTx(tx)) {
      this.hierarchy.tx(tx)
    }

    // 2. update transactions and doc storages.
    await this.txModel.tx(tx)
    if (this.logging) {
      console.info('Model updated', { sid: tx.sid, tx: tx, model: this.model })
    }

    // 3. process server side DD.
    await this.ddProcessor.tx(tx)

    // 4. process client handlers
    this.handler(tx)
  }

  async accountId (): Promise<Ref<Account>> {
    return core.account.System
  }

  async close (): Promise<void> {
    console.log('closing dev connection')
    await this.ddProcessor.close()
  }
}
