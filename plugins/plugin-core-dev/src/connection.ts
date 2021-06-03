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

import type { Tx, Storage, Ref, Doc, Class, DocumentQuery } from '@anticrm/core'
import { ModelDb, TxDb, Hierarchy, DOMAIN_TX, DOMAIN_MODEL } from '@anticrm/core'

async function getModel(): Promise<Tx[]> { 
  return import('./model.tx.json') as unknown as Tx[]
}

export async function connect(handler: (tx: Tx) => void): Promise<Storage> {

  const txes = await getModel()
  console.log(txes)

  const hierarchy = new Hierarchy()
  for (const tx of txes) hierarchy.tx(tx)

  const transactions = new TxDb(hierarchy)
  const model = new ModelDb(hierarchy)
  for (const tx of txes) {
    transactions.tx(tx)
    model.tx(tx)
  }

  function findAll<T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>): Promise<T[]> {
    const domain = hierarchy.getClass(_class).domain
    if (domain === DOMAIN_TX)
      return transactions.findAll(_class, query)
    return model.findAll(_class, query)  
  }

  return { 
    findAll,
    tx: async (tx: Tx): Promise<void> => {
      if (tx.domain === DOMAIN_MODEL) {
        hierarchy.tx(tx)
      }
      await Promise.all([model.tx(tx), transactions.tx(tx)])
      handler(tx)
    },
    isDerived: hierarchy.isDerived
  }
}