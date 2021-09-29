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

import type { Account, Class, Doc, Ref } from '../classes'
import { TxHandler, CoreClient } from '../client'
import core from '../component'
import { DerivedDataProcessor } from '../derived/processor'
import { Hierarchy } from '../hierarchy'
import { ModelDb, TxDb } from '../memdb'
import { _genMinModel } from '../minmodel'
import { isModelTx } from '../model'
import type { DocumentQuery, FindResult } from '../storage'
import { Storage } from '../storage'
import type { Tx } from '../tx'
import { DOMAIN_TX } from '../tx'

class ClientImpl implements CoreClient {
  constructor (
    private readonly hierarchy: Hierarchy,
    private readonly model: ModelDb,
    private readonly transactions: TxDb,
    private readonly handler: (tx: Tx) => void,
    private readonly ddProcessor: DerivedDataProcessor
  ) {}

  async findAll<T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>): Promise<FindResult<T>> {
    const domain = this.hierarchy.getClass(_class).domain
    if (domain === DOMAIN_TX) return await this.transactions.findAll(_class, query)
    return await this.model.findAll(_class, query)
  }

  async tx (tx: Tx): Promise<void> {
    if (isModelTx(tx)) {
      this.hierarchy.tx(tx)
    }
    await Promise.all([this.model.tx(tx), this.transactions.tx(tx)])

    await this.ddProcessor.tx(tx)

    this.handler(tx)
  }

  async accountId (): Promise<Ref<Account>> {
    return core.account.System
  }
}
function toIterableStorage (storage: Storage, handler: TxHandler): Storage {
  return {
    findAll: async (_class, query, options) => {
      return await storage.findAll(_class, query, options)
    },
    tx: async (tx) => {
      // Do not need for testing purpuse, it will be duplicate
      // await storage.tx(tx)
      handler(tx)
    }
  }
}

export async function connect (handler: (tx: Tx) => void): Promise<CoreClient> {
  const txes = _genMinModel()

  const hierarchy = new Hierarchy()
  for (const tx of txes) hierarchy.tx(tx)

  const transactions = new TxDb(hierarchy)
  const model = new ModelDb(hierarchy)

  for (const tx of txes) {
    await transactions.tx(tx)
    await model.tx(tx)
  }

  const ddProcessor = await DerivedDataProcessor.create(model, hierarchy, toIterableStorage(model, handler), true)

  return new ClientImpl(hierarchy, model, transactions, handler, ddProcessor)
}
