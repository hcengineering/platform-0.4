//
// Copyright © 2021 Anticrm Platform Contributors.
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

import { Class, Hierarchy, Doc, DocumentQuery, DOMAIN_TX, ModelDb, Ref, Tx, TxDb } from '@anticrm/core'
import modelTx from './model.tx.json'
import { start } from './server'

const txes = (modelTx as unknown) as Tx[]
console.log(txes)

const hierarchy = new Hierarchy()
for (const tx of txes) hierarchy.tx(tx)

const transactions = new TxDb(hierarchy)
const model = new ModelDb(hierarchy)
for (const tx of txes) {
  transactions.tx(tx) // eslint-disable-line
  model.tx(tx) // eslint-disable-line
}

async function findAll<T extends Doc> (
  _class: Ref<Class<T>>,
  query: DocumentQuery<T>
): Promise<T[]> {
  const domain = hierarchy.getClass(_class).domain
  if (domain === DOMAIN_TX) return await transactions.findAll(_class, query)
  return await model.findAll(_class, query)
}

// Will be used to hold security information.
interface ClientEntry {
  txs: (tx: Tx) => void
}
const clients = new Map<string, ClientEntry>()

// eslint-disable-next-line
start('localhost', 18080, { 
  connect: (clientId, txs) => {
    clients.set(clientId, { txs })
    return {
      findAll,
      tx: async (tx: Tx): Promise<void> => {
        await Promise.all([model.tx(tx), transactions.tx(tx)])
        // Send transaction to all suitable clients.
        for (const c of clients.entries()) {
          if (c[0] !== clientId) {
            c[1].txs(tx)
          }
        }
      }
    }
  },
  close: clientId => {
    clients.delete(clientId)
  }
})
