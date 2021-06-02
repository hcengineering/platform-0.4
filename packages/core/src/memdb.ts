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
import { TxProcessor } from './storage'
import type { Emb, Doc, Ref, Class, Collection, Data, PrimitiveType, Obj } from './classes'
import type { Tx, TxAddCollection, TxCreateObject } from './tx'
import type { Hierarchy } from './hierarchy'

import { generateId } from './utils'

import core from './component'

function findProperty(objects: Doc[], propertyKey: string, value: PrimitiveType): Doc[] {
  const result: Doc[] = []
  for (const object of objects) {
    if ((object as any)[propertyKey] === value) {
      result.push(object)
    }
  }
  return result
}

abstract class MemDb extends TxProcessor implements Storage {

  private readonly hierarchy: Hierarchy
  private readonly objectsByClass = new Map<Ref<Class<Doc>>, Doc[]>()
  private readonly objectById = new Map<Ref<Doc>, Doc>()

  constructor (hierarchy: Hierarchy) {
    super()
    this.hierarchy = hierarchy
  }

  private getObjectsByClass(_class: Ref<Class<Doc>>): Doc[] {
    const result = this.objectsByClass.get(_class)
    if (result === undefined) {
      const result: Doc[] = []
      this.objectsByClass.set(_class, result)
      return result
    }
    return result
  }

  protected getCollection(_id: Ref<Doc>, collection: string): Collection<Emb> {
    const doc = this.objectById.get(_id)
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

  async findAll<T extends Doc> (_class: Ref<Class<T>>, query: Partial<Data<T>>): Promise<T[]> {
    let result = this.getObjectsByClass(_class)
    for (const key in query) {
      const value = (query as any)[key]
      if (key === '_id') {
        const obj = this.objectById.get(value)
        if (obj !== undefined)
          result.push()
      } else
        result = findProperty(result, key, value)
    }
    return result as T[]
  }

  protected addDoc(doc: Doc): void {
    this.hierarchy.getAncestors(doc._class).forEach(_class => { this.getObjectsByClass(_class).push(doc) })
    this.objectById.set(doc._id, doc)
  }

  isDerived (_class: Ref<Class<Obj>>, _extendedClass:Ref<Class<Obj>>): boolean {
    return this.hierarchy.isDerived(_class, _extendedClass)
  }
}

export class TxDb extends MemDb {

  async tx(tx: Tx): Promise<void> {
    this.addDoc(tx)
  }

}

export class ModelDb extends MemDb {

  protected async txCreateObject (tx: TxCreateObject<Doc>): Promise<void> {
    this.addDoc({ _id: tx.objectId, _class: tx.objectClass, ...tx.attributes})
  }

  protected async txAddCollection (tx: TxAddCollection<Emb>): Promise<void> {
    (this.getCollection(tx.objectId, tx.collection) as any)[tx.localId ?? generateId()] = tx.attributes
  }
  
}