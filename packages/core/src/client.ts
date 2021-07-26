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

import { DerivedDataProcessor } from '.'
import type { Account, Class, Doc, Obj, Ref } from './classes'
import { DOMAIN_MODEL } from './classes'
import core from './component'
import { Hierarchy } from './hierarchy'
import { ModelDb } from './memdb'
import type { DocumentQuery, FindOptions, FindResult, Storage } from './storage'
import { Tx, TxProcessor } from './tx'

/**
 * @public
 */
export type TxHandler = (tx: Tx) => void

/**
 * @public
 */
export interface WithAccountId extends Storage {
  accountId: () => Promise<Ref<Account>>
}

/**
 * Client with hierarchy and model inside. Allow fast search for model, without accesing server.
 * @public
 */
export interface Client extends WithAccountId {
  isDerived: <T extends Obj>(_class: Ref<Class<T>>, from: Ref<Class<T>>) => boolean
}
/**
 * Implementaion of client with model and hirarchy support.
 * @internal
 */
class ClientImpl extends TxProcessor implements Client {
  readonly hierarchy = new Hierarchy()
  readonly model = new ModelDb(this.hierarchy)
  extraTx?: (tx: Tx) => Promise<void>

  constructor (readonly conn: WithAccountId, private readonly notify?: TxHandler) {
    super()
  }

  /**
   * Process notify events from connection, update model and hierarchy
   */
  txHandler (txs: Tx[], bootstrap: boolean): void {
    for (const tx of txs) {
      this.hierarchy.tx(tx)
    }
    for (const tx of txs) {
      if (tx.objectSpace === core.space.Model) {
        void this.model.tx(tx)
      }
      if (!bootstrap) {
        // We do not need to notify about model bootstap transactions.
        this.notify?.(tx)
      }
    }
  }

  isDerived<T extends Obj>(_class: Ref<Class<T>>, from: Ref<Class<T>>): boolean {
    return this.hierarchy.isDerived(_class, from)
  }

  async findAll<T extends Doc>(
    _class: Ref<Class<T>>,
    query: DocumentQuery<T>,
    options?: FindOptions<T>
  ): Promise<FindResult<T>> {
    const clazz = this.hierarchy.getClass(_class)
    if (clazz.domain === DOMAIN_MODEL) {
      return await this.model.findAll(_class, query, options)
    }
    return await this.conn.findAll(_class, query, options)
  }

  async tx (tx: Tx): Promise<void> {
    await this.conn.tx(tx)
    await this.extraTx?.(tx)
  }

  async accountId (): Promise<Ref<Account>> {
    return await this.conn.accountId()
  }
}

/**
 * Hold transactions untill they will be processed by model and hierarchy
 */
class TransactionBuffer {
  txBuffer?: Tx[] = []
  clientTx?: (tx: Tx[], bootstrap: boolean) => void

  tx (tx: Tx): void {
    if (this.clientTx === undefined) {
      this.txBuffer?.push(tx)
    } else {
      this.clientTx?.([tx], false)
    }
  }

  pretend (txes: Tx[]): void {
    this.txBuffer = txes.concat(this.txBuffer ?? [])
  }

  flush (clientTx: (tx: Tx[], bootstap: boolean) => void): void {
    this.clientTx = clientTx
    this.clientTx(this.txBuffer ?? [], true)
    this.txBuffer = undefined
  }
}

/**
 * Creates a client with hierarchy and model
 * @public
 */
export async function createClient (
  connect: (txHandler: TxHandler) => Promise<WithAccountId>,
  notify?: TxHandler
): Promise<Client> {
  const buffer = new TransactionBuffer()
  const connection = await connect((tx) => buffer.tx(tx)) // << --- new transactions go into buffer, until we process existing ones.

  const txes = await connection.findAll(core.class.Tx, { objectSpace: core.space.Model })

  // Put all transactions we recieve before out model transactions.
  buffer.pretend(txes)

  const client = new ClientImpl(connection, notify)

  // Apply all model transactions, including ones arrived during findAll is executed.
  buffer.flush((txs, bootstrap) => client.txHandler(txs, bootstrap))

  return await withDerivedDataProcessor(client)
}

/**
 * @public
 */
async function withDerivedDataProcessor (client: ClientImpl): Promise<Client> {
  // D E R I V E D   D A T A
  const ddProcessor = await DerivedDataProcessor.create(client.model, client.hierarchy, newClientOnlyStorage(client))
  client.extraTx = async (tx: Tx) => {
    await ddProcessor.tx(tx)
  }

  return client
}
/**
 * @internal
 */
function newClientOnlyStorage (client: ClientImpl): Storage {
  return {
    findAll: async (_class, query) => await client.findAll(_class, query),
    tx: async (tx) => {
      // No operation to connection is required, it will be performed on server.
      client.txHandler([tx], false)
    }
  }
}
