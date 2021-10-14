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
import { Hierarchy } from './hierarchy'
import { ModelDb } from './memdb'
import { findModelTxs, isModelFind, isModelTx } from './model'
import type { DocumentQuery, FindOptions, FindResult, Storage } from './storage'
import { Tx, TxProcessor } from './tx'

/**
 * @public
 */
export type TxHandler = (tx: Tx) => void

/**
 * @public
 */
export interface CoreClient extends Storage {
  accountId: () => Promise<Ref<Account>>
}

/**
 * Client with hierarchy and model inside. Allow fast search for model, without accesing server.
 * @public
 */
export interface Client extends CoreClient {
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

  constructor (readonly conn: CoreClient, readonly connAccount: Ref<Account>, private readonly notify?: TxHandler) {
    super()
  }

  /**
   * Process notify events from connection, update model and hierarchy
   */
  txHandler (txs: Tx[], bootstrap: boolean): void {
    const modelTx = txs.filter(isModelTx)

    // Hierarchy should be updated first, since model could use it.
    modelTx.forEach((tx) => this.hierarchy.tx(tx))

    // Now it is safe to update model, since hierarchy is up to date.
    modelTx.forEach((tx) => void this.model.tx(tx))

    if (!bootstrap && this.notify !== undefined) {
      // Notify passed handler.
      txs.forEach(this.notify)
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
    const storage = isModelFind(_class, this.hierarchy) ? this.model : this.conn
    return await storage.findAll(_class, query, options)
  }

  async tx (tx: Tx): Promise<void> {
    await this.conn.tx(tx)
    await this.extraTx?.(tx)
  }

  async accountId (): Promise<Ref<Account>> {
    return this.connAccount
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
  connect: (txHandler: TxHandler) => Promise<CoreClient>,
  notify?: TxHandler
): Promise<Client> {
  const buffer = new TransactionBuffer()
  const connection = await connect((tx) => buffer.tx(tx)) // << --- new transactions go into buffer, until we process existing ones.

  const accountId = await connection.accountId()

  const txes = await findModelTxs(connection, accountId)

  // Put all transactions we recieve before out model transactions.
  buffer.pretend(txes)

  const client = new ClientImpl(connection, accountId, notify)

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
    findAll: async (_class, query, options) => await client.findAll(_class, query, options),
    tx: async (tx) => {
      client.txHandler([tx], false)
    }
  }
}
