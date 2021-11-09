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

import { measure, measureAsync, SortingOrder } from '.'
import type { Account, Class, Doc, Obj, Ref } from './classes'
import { Hierarchy } from './hierarchy'
import { ModelDb } from './memdb'
import { findModelTxs, isModelFind, isModelTx } from './model'
import type { DocumentQuery, FindOptions, FindResult, Storage } from './storage'
import { Tx, TxProcessor } from './tx'
import { HierarchyClient } from './hierarchy'
import core from './component'

/**
 * @public
 */
export type TxHandler = (tx: Tx) => void

/**
 * @public
 */
export interface CoreClient extends Storage {
  accountId: () => Promise<Ref<Account>>

  // Perform connection close
  close: () => Promise<void>
}

/**
 * Client with hierarchy and model inside. Allow fast search for model, without accesing server.
 * @public
 */
export interface Client extends CoreClient, HierarchyClient {}
/**
 * Implementaion of client with model and hirarchy support.
 * @internal
 */
class ClientImpl extends TxProcessor implements Client {
  readonly hierarchy = new Hierarchy()
  readonly model = new ModelDb(this.hierarchy)
  extraTx?: (tx: Tx) => Promise<void>
  lastSID: number = 0

  constructor (
    readonly conn: CoreClient,
    readonly connAccount: Ref<Account>,
    private readonly notify: TxHandler | undefined,
    lastSid: number
  ) {
    super()
    this.lastSID = lastSid
  }

  /**
   * Process notify events from connection, update model and hierarchy
   */
  txHandler (txs: Tx[], bootstrap: boolean): void {
    txs.forEach((tx: Tx) => {
      if (tx.sid > this.lastSID) {
        this.lastSID = tx.sid
      }
    })
    const modelTx = txs.filter(isModelTx)

    // Hierarchy should be updated first, since model could use it.
    modelTx.forEach((tx) => {
      const done = measure('client.hierarchy.tx', tx._class)
      this.hierarchy.tx(tx)
      done()
    })

    // Now it is safe to update model, since hierarchy is up to date.
    modelTx.forEach((tx) => void measureAsync('client.model.tx', async () => await this.model.tx(tx), tx._class))

    if (!bootstrap && this.notify !== undefined) {
      // Notify passed handler.
      txs.forEach(this.notify)
    }
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

  async findAll<T extends Doc>(
    _class: Ref<Class<T>>,
    query: DocumentQuery<T>,
    options?: FindOptions<T>
  ): Promise<FindResult<T>> {
    const isModel = isModelFind(_class, this.hierarchy)
    const storage = isModel ? this.model : this.conn
    return await measureAsync('client.findAll', async () => await storage.findAll(_class, query, options), _class)
  }

  async tx (tx: Tx): Promise<void> {
    if (tx.sid === 0) {
      this.lastSID++
      tx.sid = this.lastSID
    }
    await measureAsync('client.tx', async () => await this.conn.tx(tx), tx._class)
    await measureAsync('client.extra.tx', async () => await this.extraTx?.(tx), tx._class)
  }

  async accountId (): Promise<Ref<Account>> {
    return this.connAccount
  }

  async close (): Promise<void> {
    return await this.conn.close()
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
  const connection = await measureAsync('connect', async () => await connect((tx) => buffer.tx(tx))) // << --- new transactions go into buffer, until we process existing ones.

  const accountId = await connection.accountId()

  const txes = await findModelTxs(connection, accountId)

  // Put all transactions we recieve before out model transactions.
  buffer.pretend(txes)

  const lastSID =
    (await connection.findAll(core.class.Tx, {}, { limit: 1, sort: { sid: SortingOrder.Descending } })).shift()?.sid ??
    0

  const client = new ClientImpl(connection, accountId, notify, lastSID)

  // Apply all model transactions, including ones arrived during findAll is executed.
  buffer.flush((txs, bootstrap) => client.txHandler(txs, bootstrap))

  return client
}
