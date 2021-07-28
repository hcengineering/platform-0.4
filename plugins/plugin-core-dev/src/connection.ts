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
  DerivedDataProcessor,
  Doc,
  DocumentQuery,
  DOMAIN_TX,
  FindResult,
  Hierarchy,
  ModelDb,
  Obj,
  Ref,
  Storage,
  Tx,
  TxDb,
  TxProcessor,
  WithAccountId
} from '@anticrm/core'
import builder from '@anticrm/model-dev'
import copy from 'fast-copy'

class ClientImpl extends TxProcessor implements Client {
  extraTx?: (tx: Tx) => Promise<void>
  constructor (
    readonly hierarchy: Hierarchy,
    readonly model: ModelDb,
    readonly transactions: TxDb,
    readonly handler: (tx: Tx) => void
  ) {
    super()
  }

  isDerived<T extends Obj>(_class: Ref<Class<T>>, from: Ref<Class<T>>): boolean {
    return this.hierarchy.isDerived(_class, from)
  }

  static createDerivedDataStorage (storage: Storage, sendTo: (tx: Tx) => void): Storage {
    // Send derived data produced objects to clients.
    return {
      findAll: async (_class, query) => await storage.findAll(_class, query),
      tx: async (tx) => {
        await storage.tx(tx)

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        sendTo(tx)
      }
    }
  }

  static async create (handler: (tx: Tx) => void): Promise<ClientImpl> {
    const txes = builder.getTxes()

    const hierarchy = new Hierarchy()
    for (const tx of txes) hierarchy.tx(tx)

    const transactions = new TxDb(hierarchy)
    const model = new ModelDb(hierarchy)
    for (const tx of txes) {
      await transactions.tx(tx)
    }
    for (const tx of txes) {
      await model.tx(tx)
    }

    // This is for debug, to check for current model inside browser.
    if (typeof window !== 'undefined') {
      // Print model only from browser console.
      console.info('Model Build complete', model)
    }
    return new ClientImpl(hierarchy, model, transactions, handler)
  }

  async findAll<T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>): Promise<FindResult<T>> {
    const domain = this.hierarchy.getClass(_class).domain
    if (domain === DOMAIN_TX) return await this.transactions.findAll(_class, query)
    return copy(await this.model.findAll(_class, query))
  }

  async tx (tx: Tx): Promise<void> {
    // 1. We go into model it will check for potential errors and will reject before transaction will be stored.
    await this.model.tx(tx)

    // 2. update hierarchy
    if (tx.objectSpace === core.space.Model) {
      this.hierarchy.tx(tx)
    }

    // 3. update transactions
    await this.transactions.tx(tx)

    if (typeof window !== 'undefined') {
      console.info('Model updated', this.model)
    }

    // 5. process client handlers
    this.handler(tx)

    this.extraTx?.(tx)
  }

  async accountId (): Promise<Ref<Account>> {
    return core.account.System
  }
}

export async function connect (handler: (tx: Tx) => void): Promise<WithAccountId> {
  const client = await ClientImpl.create(handler)
  const ddProcessor = await DerivedDataProcessor.create(client.model, client.hierarchy, newClientOnlyStorage(client))
  client.extraTx = async (tx: Tx) => {
    await ddProcessor.tx(tx)
  }
  return client
}

function newClientOnlyStorage (client: ClientImpl): Storage {
  return {
    findAll: async (_class, query) => await client.findAll(_class, query),
    tx: async (tx) => {
      await client.model.tx(tx)
    }
  }
}
