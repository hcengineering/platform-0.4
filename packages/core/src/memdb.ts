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

import { PlatformError, Severity, Status } from '@anticrm/status'
import type { Class, Collection, Doc, Data, CollectionItem, Ref } from './classes'
import core from './component'
import type { Hierarchy } from './hierarchy'
import { DocumentQuery, Storage } from './storage'
import { Tx, TxCreateDoc, TxProcessor } from './tx'
import { isPredicate, createPredicate } from './predicate'

function findProperty (objects: Doc[], propertyKey: string, value: any): Doc[] {
  if (isPredicate(value)) {
    const pred = createPredicate(value, propertyKey)
    return pred(objects)
  }
  const result: Doc[] = []
  for (const object of objects) {
    if ((object as any)[propertyKey] === value) {
      result.push(object)
    }
  }
  return result
}

class TCollection<T extends CollectionItem> implements Collection<T> {
  private objects = new Map<string | number, Ref<CollectionItem>>()

  constructor (private readonly memDb: MemDb) {}

  get(key: string | number): T {
    const obj = this.objects.get(key)
    if (obj === undefined)
      throw new Error('embedded object not found: ' + key)
    return this.memDb.getObject(obj) as T
  }

  add(key: string | number, object: Ref<CollectionItem>) {
    this.objects.set(key, object)
  }

  get length(): number { return this.objects.size }
}

class MemDb extends TxProcessor {
  protected readonly hierarchy: Hierarchy
  private readonly objectsByClass = new Map<Ref<Class<Doc>>, Doc[]>()
  private readonly objectById = new Map<Ref<Doc>, Doc>()

  constructor (hierarchy: Hierarchy) {
    super ()
    this.hierarchy = hierarchy
  }

  private getObjectsByClass (_class: Ref<Class<Doc>>): Doc[] {
    const result = this.objectsByClass.get(_class)
    if (result === undefined) {
      const result: Doc[] = []
      this.objectsByClass.set(_class, result)
      return result
    }
    return result
  }

  getObject<T extends Doc> (_id: Ref<T>): T {
    const doc = this.objectById.get(_id)
    if (doc === undefined) {
      throw new PlatformError(new Status(Severity.ERROR, core.status.ObjectNotFound, { _id }))
    }
    return doc as T
  }

  getCollection (_id: Ref<Doc>, collection: string): Collection<CollectionItem> {
    const doc = this.getObject(_id) as any
    const result = doc[collection]
    if (result === undefined) {
      const result = new TCollection(this)
      doc[collection] = result
      return result
    }
    return result
  }

  async findAll<T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>): Promise<T[]> {
    let result: Doc[]
    if (Object.prototype.hasOwnProperty.call(query, '_id')) {
      const docQuery = query as DocumentQuery<Doc>
      if (docQuery._id === undefined) {
        result = []
      } else if (typeof docQuery._id === 'string') {
        const obj = this.objectById.get(docQuery._id)
        result = obj !== undefined ? [obj] : []
      } else {
        const ids = docQuery._id.$in ?? []
        result = []
        for (const id of ids) {
          const obj = this.objectById.get(id)
          if (obj !== undefined) result.push(obj)
        }
      }
    } else {
      result = this.getObjectsByClass(_class)
    }

    for (const key in query) {
      if (key === '_id') continue
      const value = (query as any)[key]
      result = findProperty(result, key, value)
    }
    return [...result] as T[]
  }

  addDoc (doc: Doc): void {
    this.hierarchy.getAncestors(doc._class).forEach((_class) => {
      this.getObjectsByClass(_class).push(doc)
    })
    this.objectById.set(doc._id, doc)
  }
}

/**
 * Hold transactions
 */
export class TxDb extends MemDb implements Storage {
  async tx (tx: Tx): Promise<void> {
    this.addDoc(tx)
  }
}

/**
 * Hold model objects and classes
 */
export class ModelDb extends MemDb implements Storage {

  protected async txCreateDoc (tx: TxCreateDoc<Doc>): Promise<void> {
    this.addDoc(TxProcessor.createDoc2Doc(tx))
    if (this.hierarchy.isDerived(tx.objectClass, core.class.CollectionItem)) {
      const item = tx.attributes as Data<CollectionItem>

    }
  }

}
