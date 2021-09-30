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
  Doc,
  DocumentQuery,
  DOMAIN_TX,
  FindResult,
  Hierarchy,
  isModelTx,
  ModelDb,
  Obj,
  Ref,
  Tx,
  TxDb,
  TxProcessor,
  DerivedDataProcessor
} from '@anticrm/core'
import builder from '@anticrm/model-dev'
import copy from 'fast-copy'

export class ClientImpl extends TxProcessor implements Client {
  handler: (tx: Tx) => void = () => {}
  constructor (
    readonly hierarchy: Hierarchy,
    readonly model: ModelDb,
    readonly transactions: TxDb,
    readonly ddProcessor: DerivedDataProcessor
  ) {
    super()
  }

  isDerived<T extends Obj>(_class: Ref<Class<T>>, from: Ref<Class<T>>): boolean {
    return this.hierarchy.isDerived(_class, from)
  }

  static async create (): Promise<ClientImpl> {
    const txes = builder.getTxes()

    const hierarchy = new Hierarchy()
    txes.forEach((tx) => hierarchy.tx(tx))

    const transactions = new TxDb(hierarchy)
    const model = new ModelDb(hierarchy)
    for (const tx of txes) {
      await transactions.tx(tx)
    }
    for (const tx of txes) {
      await model.tx(tx)
    }

    // This is for debug, to check for current model inside browser.
    console.info('Model Build complete', model)

    let clientImpl: ClientImpl

    const ddProcessor = await DerivedDataProcessor.create(
      model,
      hierarchy,
      {
        findAll: async (_class, query, options) => {
          return await model.findAll(_class, query, options)
        },
        tx: async (tx) => {
          // Do not need for testing purpuse, it will be duplicate
          await model.tx(tx)
          clientImpl?.handler(tx)
        }
      },
      true
    )
    return new ClientImpl(hierarchy, model, transactions, ddProcessor)
  }

  async findAll<T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>): Promise<FindResult<T>> {
    const domain = this.hierarchy.getClass(_class).domain
    if (domain === DOMAIN_TX) return await this.transactions.findAll(_class, query)
    return copy(await this.model.findAll(_class, query))
  }

  async tx (tx: Tx): Promise<void> {
    // 1. update hierarchy
    if (isModelTx(tx)) {
      this.hierarchy.tx(tx)
    }

    // 2. update transactions
    await this.transactions.tx(tx)

    // 3. process server side DD.

    await this.ddProcessor.tx(tx)

    // 4. process client handlers
    this.handler(tx)

    console.info('Model updated', this.model)
  }

  async accountId (): Promise<Ref<Account>> {
    return core.account.System
  }
}
