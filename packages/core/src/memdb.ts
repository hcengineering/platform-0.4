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

import { Status, Severity, PlatformError } from '@anticrm/status'

import type { Storage } from './storage'
import type { Emb, Doc, Ref, Class, Collection, Data, PrimitiveType } from './classes'
import type { Tx, TxAddCollection, TxCreateObject } from './tx'
import type { Hierarchy } from './hierarchy'
import { generateId } from './utils'

import core from './component'

export function createMemDb(hierarchy: Hierarchy): Storage {

  const objectsByClass = new Map<Ref<Class<Doc>>, Doc[]>()
  const objectById = new Map<Ref<Doc>, Doc>()

  function getObjectsByClass(_class: Ref<Class<Doc>>): Doc[] {
    const result = objectsByClass.get(_class)
    if (result === undefined) {
      const result: Doc[] = []
      objectsByClass.set(_class, result)
      return result
    }
    return result
  }

  function getCollection(_id: Ref<Doc>, collection: string): Collection<Emb> {
    const doc = objectById.get(_id)
    if (doc === undefined)
      throw new PlatformError(new Status(Severity.ERROR, core.status.ObjectNotFound, { _id }))
    const result = (doc as any)[collection]
    if (result === undefined) {
      const result = {} as Collection<Emb>
      ;(doc as any)[collection] = result
      return result
    }
    return result
  }

  const txProcessor = { 
    [core.class.TxCreateObject]: async (tx: TxCreateObject<Doc>): Promise<void> => {
      const doc = { _id: tx.objectId, _class: tx.objectClass, ...tx.attributes}
      hierarchy.getAncestors(doc._class).forEach(_class => { getObjectsByClass(_class).push(doc) })
      objectById.set(doc._id, doc)
    },
    [core.class.TxAddCollection]: async (tx: TxAddCollection<Emb>): Promise<void> => {
      (getCollection(tx.objectId, tx.collection) as any)[tx.localId ?? generateId()] = tx.attributes
    }
  }

  function findProperty(objects: Doc[], propertyKey: string, value: PrimitiveType): Doc[] {
    const result: Doc[] = []
    for (const object of objects) {
      if ((object as any)[propertyKey] === value) {
        result.push(object)
      }
    }
    return result
  }

  async function findAll<T extends Doc> (_class: Ref<Class<T>>, query: Partial<Data<T>>): Promise<T[]> {
    let result = getObjectsByClass(_class)
    for (const key in query) {
      const value = (query as any)[key]
      if (key === '_id') {
        const obj = objectById.get(value)
        if (obj !== undefined)
          result.push()
      } else
        result = findProperty(result, key, value)
    }
    return result as T[]
  }

  function tx(tx: Tx): Promise<void> {
    const f = txProcessor[tx._class] as (tx: Tx) => Promise<void>
    if (f === undefined) {
      throw new PlatformError(new Status(Severity.ERROR, core.status.CannotHandleTx, {_class: tx._class}))
    }
    return f(tx)
  }

  return { findAll, tx }
}