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

import type { Storage, Tx, Doc, Ref, Class, DocumentQuery } from '@anticrm/core'
import { getPlugin } from '@anticrm/platform'

import pluginCore from '@anticrm/plugin-core'
import core, { DOMAIN_MODEL, createHierarchy, createMemDb } from '@anticrm/core'

let client: Storage | undefined

async function createClient(): Promise<Storage> {
  const plugin = await getPlugin(pluginCore.id)

  let txBuffer: Tx[] | undefined = []
  
  const hierarchy = createHierarchy()
  const model = createMemDb(hierarchy)

  function txHander(tx: Tx): void {
    if (client === undefined) {
      txBuffer?.push(tx)
    } else {
      hierarchy.tx(tx)
      model.tx(tx)
    }
  }

  const conn = await plugin.connect(txHander)
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

  client = { findAll, tx: conn.tx }

  for (const tx of txBuffer) txHander(tx)
  txBuffer = undefined

  return client
}

export async function getClient(): Promise<Storage> {
  if (client === undefined) {
    client = await createClient()
  }
  return client
}
