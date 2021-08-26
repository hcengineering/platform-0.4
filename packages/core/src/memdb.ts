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
import { findProperty, resultSort, shouldSkipId } from './query'
import { DocumentQuery, FindOptions, FindResult, Storage } from './storage'
import { Tx, TxCreateDoc, TxProcessor, TxRemoveDoc, TxUpdateDoc } from './tx'

/**
 * @public
 */
export class MemDb extends TxProcessor implements Storage {
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

  private getByIdQuery<T extends Doc>(query: DocumentQuery<T>, _class: Ref<Class<T>>): Doc[] {
    const result = []
    if (typeof query._id === 'string') {
      const obj = this.objectById.get(query._id)
      if (obj !== undefined) result.push(obj)
    } else if (query._id?.$in !== undefined) {
      const ids = new Set(query._id.$in)
      for (const id of ids) {
        const obj = this.objectById.get(id)
        if (obj !== undefined) result.push(obj)
      }
    }
    return result
  }

  getObjectByIdAndClass<T extends Doc>(_id: Ref<T>, _class: Ref<Class<T>>): T {
    const doc = this.getObject(_id)
    if (!this.hierarchy.isDerived(doc._class, _class)) {
      throw new PlatformError(new Status(Severity.ERROR, core.status.ObjectNotFound, { _id }))
    }
    return doc
  }

  getObject<T extends Doc>(_id: Ref<T>): T {
    const doc = this.objectById.get(_id)
    if (doc === undefined) {
      throw new PlatformError(new Status(Severity.ERROR, core.status.ObjectNotFound, { _id }))
    }
    return doc as T
  }

  async findAll<T extends Doc>(
    _class: Ref<Class<T>>,
    query: DocumentQuery<T>,
    options?: FindOptions<T>
  ): Promise<FindResult<T>> {
    let result: Doc[]
    if (
      Object.prototype.hasOwnProperty.call(query, '_id') &&
      (typeof query._id === 'string' || query._id?.$in !== undefined)
    ) {
      result = this.getByIdQuery(query, _class)
    } else {
      result = this.getObjectsByClass(_class)
    }

    for (const key in query) {
      if (shouldSkipId<T>(key, query)) continue
      const value = (query as any)[key]
      result = findProperty(result, key, value)
    }

    if (options?.sort !== undefined) resultSort(result, options?.sort)

    const total = result.length
    result = result.slice(0, options?.limit)
    return Object.assign(result as T[], { total })
  }

  addDoc (doc: Doc): void {
    const obj = this.objectById.get(doc._id)
    if (obj !== undefined) {
      throw new PlatformError(new Status(Severity.ERROR, core.status.ObjectAlreadyExists, { _id: doc._id }))
    }
    this.hierarchy.getAncestors(doc._class).forEach((_class) => {
      this.getObjectsByClass(_class).push(doc)
    })
    this.objectById.set(doc._id, doc)
  }

  delDoc (_id: Ref<Doc>): void {
    const doc = this.getObject(_id)
    this.objectById.delete(_id)
    this.hierarchy.getAncestors(doc._class).forEach((_class) => {
      this.cleanObjectByClass(_class, _id)
    })
  }
}

/**
 * Hold transactions
 * @public
 */
export class TxDb extends MemDb {
  async tx (tx: Tx): Promise<void> {
    this.addDoc(tx)
  }
}

/**
 * Hold model objects and classes
 * @public
 */
export class ModelDb extends MemDb implements Storage {
  protected async txCreateDoc (tx: TxCreateDoc<Doc>): Promise<void> {
    this.addDoc(TxProcessor.createDoc2Doc(tx))
  }

  protected async txUpdateDoc (tx: TxUpdateDoc<Doc>): Promise<void> {
    const doc = this.getObjectByIdAndClass(tx.objectId, tx.objectClass) as any
    const ops = tx.operations as any
    for (const key in ops) {
      if (key.startsWith('$')) {
        const operator = getOperator(key)
        operator(doc, ops[key])
      } else {
        doc[key] = ops[key]
      }
    }
    doc.modifiedBy = tx.modifiedBy
    doc.modifiedOn = tx.modifiedOn
  }

  protected async txRemoveDoc (tx: TxRemoveDoc<Doc>): Promise<void> {
    this.delDoc(tx.objectId)
  }
}
