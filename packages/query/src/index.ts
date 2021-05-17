//
// Copyright © 2020, 2021 Anticrm Platform Contributors.
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

import type { Ref, Class, Doc, Tx, DocumentQuery, Storage, TxCreateObject, Data } from '@anticrm/core'
import { createTxProcessor } from '@anticrm/core'

export interface LiveQuery {
  query <T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>, callback: (result: T[]) => void): () => void
  tx(tx: Tx): Promise<void>
}

type Query = {
  _class: Ref<Class<Doc>>
  query: DocumentQuery<Doc>
  callback: (result: Doc[]) => void
}

export function createLiveQuery(storage: Storage): LiveQuery {

  const queries: Query[] = []

  function refresh(query: Query): Promise<void> {
    return storage.findAll(query._class, query.query).then(result => query.callback(result))
  }

  function query <T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>, callback: (result: T[]) => void): () => void {
    const q: Query = { _class, query, callback: callback as (result: Doc[]) => void }
    queries.push(q)
    refresh(q)
    return () => { queries.splice(queries.indexOf(q)) }
  }

  function match(query: DocumentQuery<Doc>, attributes: Data<Doc>): boolean {
    for (const key in query) {
      const value = (query as any)[key]
      if ((attributes as any)[key] !== value)
        return false
    }
    return true
  }

  const tx = createTxProcessor({
    async txCreateObject(tx: TxCreateObject<Doc>): Promise<void> {
      for (const q of queries) {
        if (match(q.query, tx.attributes)) {
          refresh(q)
        }
      }
    }
  })

  return { query, tx }
}