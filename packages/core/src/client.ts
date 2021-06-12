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

import type { Doc, Ref, Class, Obj, Account } from './classes'
import type { Storage, DocumentQuery } from './storage'
import type { Tx } from './tx'

import { Hierarchy } from './hierarchy'
import { ModelDb } from './memdb'
import { DOMAIN_MODEL } from './classes'
import { TxOperations } from './tx'

import core from './component'

type TxHander = (tx: Tx) => void

export interface Client extends TxOperations, Storage {
  isDerived: <T extends Obj>(_class: Ref<Class<T>>, from: Ref<Class<T>>) => boolean
}

class ClientImpl extends TxOperations implements Storage {
  constructor (
    user: Ref<Account>,
    private readonly hierarchy: Hierarchy,
    private readonly model: ModelDb,
    private readonly conn: Storage
  ) {
    super(user)
  }

  isDerived<T extends Obj>(_class: Ref<Class<T>>, from: Ref<Class<T>>): boolean {
    return this.hierarchy.isDerived(_class, from)
  }

  async findAll<T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>): Promise<T[]> {
    const clazz = this.hierarchy.getClass(_class)
    if (clazz.domain === DOMAIN_MODEL) {
      return await this.model.findAll(_class, query)
    }
    return await this.conn.findAll(_class, query)
  }

  async tx (tx: Tx): Promise<void> {
    await this.conn.tx(tx)
  }
}

export async function createClient (connect: (txHandler: TxHander) => Promise<Storage>): Promise<Client> {
  let client: Client | null = null
  let txBuffer: Tx[] | undefined = []

  const hierarchy = new Hierarchy()
  const model = new ModelDb(hierarchy)

  function txHander (tx: Tx): void {
    if (client === null) {
      txBuffer?.push(tx)
    } else {
      hierarchy.tx(tx)
      void model.tx(tx)
    }
  }

  const conn = await connect(txHander)
  const txes = await conn.findAll(core.class.Tx, { objectSpace: core.space.Model })

  const txMap = new Map<Ref<Tx>, Ref<Tx>>()
  for (const tx of txes) txMap.set(tx._id, tx._id)
  for (const tx of txes) hierarchy.tx(tx)
  for (const tx of txes) await model.tx(tx)

  txBuffer = txBuffer.filter((tx) => txMap.get(tx._id) === undefined)

  client = new ClientImpl(core.account.System, hierarchy, model, conn)

  for (const tx of txBuffer) txHander(tx)
  txBuffer = undefined

  return client
}
