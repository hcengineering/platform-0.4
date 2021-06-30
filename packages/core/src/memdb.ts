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
import type { Class, Doc, Ref } from './classes'
import core from './component'
import type { Hierarchy } from './hierarchy'
import { getOperator } from './operator'
import { createPredicates, isPredicate } from './predicate'
import { DocumentQuery, Storage } from './storage'
import { Tx, TxCreateDoc, TxProcessor, TxRemoveDoc, TxUpdateDoc } from './tx'

function findProperty (objects: Doc[], propertyKey: string, value: any): Doc[] {
  if (isPredicate(value)) {
    const preds = createPredicates(value, propertyKey)
    for (const pred of preds) {
      objects = pred(objects)
    }
    return objects
  }
  const result: Doc[] = []
  for (const object of objects) {
    if ((object as any)[propertyKey] === value) {
      result.push(object)
    }
  }
  return result
}

class MemDb extends TxProcessor {
  protected readonly hierarchy: Hierarchy
  private readonly objectsByClass = new Map<Ref<Class<Doc>>, Doc[]>()
  private readonly objectById = new Map<Ref<Doc>, Doc>()

  constructor (hierarchy: Hierarchy) {
    super()
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

  private cleanObjectByClass (_class: Ref<Class<Doc>>, _id: Ref<Doc>): void {
    let result = this.objectsByClass.get(_class)
    if (result !== undefined) {
      result = result.filter((cl) => cl._id !== _id)
      this.objectsByClass.set(_class, result)
    }
  }

  private getByIdQuery (query: DocumentQuery<Doc>): Doc[] {
    const result = []
    if (typeof query._id === 'string') {
      const obj = this.objectById.get(query._id)
      if (obj !== undefined) result.push(obj)
    } else if (query._id?.$in !== undefined) {
      const ids = query._id.$in
      for (const id of ids) {
        const obj = this.objectById.get(id)
        if (obj !== undefined) result.push(obj)
      }
    }
    return result
  }

  getObject<T extends Doc>(_id: Ref<T>): T {
    const doc = this.objectById.get(_id)
    if (doc === undefined) {
      console.log(_id)
      throw new PlatformError(new Status(Severity.ERROR, core.status.ObjectNotFound, { _id }))
    }
    return doc as T
  }

  async findAll<T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>): Promise<T[]> {
    let result: Doc[]
    if (Object.prototype.hasOwnProperty.call(query, '_id')) {
      result = this.getByIdQuery(query)
    } else {
      result = this.getObjectsByClass(_class)
    }

    for (const key in query) {
      if (key === '_id' && (query._id as any)?.$like === undefined) continue
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

  delDoc (_id: Ref<Doc>): void {
    const doc = this.objectById.get(_id)
    if (doc === undefined) {
      throw new PlatformError(new Status(Severity.ERROR, core.status.ObjectNotFound, { _id }))
    }
    this.objectById.delete(_id)
    this.hierarchy.getAncestors(doc._class).forEach((_class) => {
      this.cleanObjectByClass(_class, _id)
    })
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
  }

  protected async txUpdateDoc (tx: TxUpdateDoc<Doc>): Promise<void> {
    const doc = this.getObject(tx.objectId) as any
    const ops = tx.operations as any
    for (const key in ops) {
      if (key.startsWith('$')) {
        const operator = getOperator(key)
        operator(doc, ops[key])
      } else {
        doc[key] = ops[key]
      }
    }
  }

  protected async txRemoveDoc (tx: TxRemoveDoc<Doc>): Promise<void> {
    this.delDoc(tx.objectId)
  }
}
