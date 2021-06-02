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

import type { Doc, Ref, Class } from './classes'
import type { Storage, DocumentQuery } from './storage'
import type { Tx } from './tx'

import { createHierarchy } from './hierarchy'
import { ModelDb } from './memdb'
import { DOMAIN_MODEL } from './classes'

import core from './component'

type TxHander = (tx: Tx) => void

export async function createClient(connect: (txHandler: TxHander) => Promise<Storage>): Promise<Storage> {
  let client: Storage | undefined
  let txBuffer: Tx[] | undefined = []
  
  const hierarchy = createHierarchy()
  const model = new ModelDb(hierarchy)

  function txHander(tx: Tx): void {
    if (client === undefined) {
      txBuffer?.push(tx)
    } else {
      hierarchy.tx(tx)
      model.tx(tx)
    }
  }

  const conn = await connect(txHander)
  const txes = await conn.findAll(core.class.Tx, { domain: DOMAIN_MODEL })

  function findAll<T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>): Promise<T[]> {
    const clazz = hierarchy.getClass(_class)
    if (clazz.domain === DOMAIN_MODEL)
      return model.findAll(_class, query)
    return conn.findAll(_class, query)
  }

  const txMap = new Map<Ref<Tx>, Ref<Tx>>()
  for (const tx of txes) txMap.set(tx._id, tx._id)
  for (const tx of txes) hierarchy.tx(tx)
  for (const tx of txes) model.tx(tx)

  txBuffer = txBuffer.filter(tx => txMap.get(tx._id) === undefined)

  client = { findAll, tx: conn.tx, isDerived: hierarchy.isDerived }

  for (const tx of txBuffer) txHander(tx)
  txBuffer = undefined

  return client
}
