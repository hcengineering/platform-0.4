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

import type { Class, Doc, Ref } from './classes'
import type { Tx } from './tx'

export type DocumentQuery<T extends Doc> = Partial<T>

export interface Storage {
  findAll: <T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>) => Promise<T[]>
  tx: (tx: Tx) => Promise<void>
}

/**
 * Create a combined storage.
 * @param storage
 * @returns
 */
export function combine (...storage: Storage[]): Storage {
  return {
    async findAll<T extends Doc>(_class: Ref<Class<T>>, query: Partial<T>): Promise<T[]> {
      return (await Promise.all(storage.map(async (it) => await it.findAll(_class, query)))).reduce((result, cur) => {
        result.push(...cur)
        return result
      })
    },
    async tx (tx: Tx): Promise<void> {
      await Promise.all(storage.map(async (it) => await it.tx(tx)))
    }
  }
}
