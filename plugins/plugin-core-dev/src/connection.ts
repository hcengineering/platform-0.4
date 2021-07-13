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

import type { Account, AccountProvider, Class, Doc, DocumentQuery, FindResult, Ref, Storage, Tx } from '@anticrm/core'
import core, { DOMAIN_TX, Hierarchy, ModelDb, TxDb } from '@anticrm/core'
import builder from '@anticrm/model-dev'

class ClientImpl implements Storage, AccountProvider {
  constructor (
    readonly hierarchy: Hierarchy,
    readonly model: ModelDb,
    readonly transactions: TxDb,
    readonly handler: (tx: Tx) => void
  ) {}

  async findAll<T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>): Promise<FindResult<T>> {
    const domain = this.hierarchy.getClass(_class).domain
    if (domain === DOMAIN_TX) return await this.transactions.findAll(_class, query)
    return await this.model.findAll(_class, query)
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

    // 4. process client handlers
    this.handler(tx)
  }

  async accountId (): Promise<Ref<Account>> {
    return core.account.System
  }
}

export async function connect (handler: (tx: Tx) => void): Promise<Storage & AccountProvider> {
  const txes = builder.getTxes()

  const hierarchy = new Hierarchy()
  for (const tx of txes) hierarchy.tx(tx)

  const transactions = new TxDb(hierarchy)
  const model = new ModelDb(hierarchy)
  for (const tx of txes) {
    await Promise.all([transactions.tx(tx), model.tx(tx)])
  }

  // This is for debug, to check for current model inside browser.
  console.info('Model Build complete', model)

  return new ClientImpl(hierarchy, model, transactions, handler)
}
