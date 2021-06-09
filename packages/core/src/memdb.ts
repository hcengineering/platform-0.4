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
import type { Class, Collection, Data, Doc, Emb, PrimitiveType, Ref } from './classes'
import core from './component'
import type { Hierarchy } from './hierarchy'
import { DocumentQuery, Storage } from './storage'
import { Tx, TxAddCollection, TxCreateDoc, TxProcessor } from './tx'
import { generateId } from './utils'

function findProperty (objects: Doc[], propertyKey: string, value: PrimitiveType): Doc[] {
  const result: Doc[] = []
  for (const object of objects) {
    if ((object as any)[propertyKey] === value) {
      result.push(object)
    }
  }
  return result
}

class MemDb {
  private readonly hierarchy: Hierarchy
  private readonly objectsByClass = new Map<Ref<Class<Doc>>, Doc[]>()
  private readonly objectById = new Map<Ref<Doc>, Doc>()

  constructor (hierarchy: Hierarchy) {
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

  getCollection (_id: Ref<Doc>, collection: string): Collection<Emb> {
    const doc = this.objectById.get(_id)
    if (doc === undefined) {
      throw new PlatformError(new Status(Severity.ERROR, core.status.ObjectNotFound, { _id }))
    }
    const result = (doc as any)[collection]
    if (result === undefined) {
      const result = {} as Collection<Emb> // eslint-disable-line @typescript-eslint/consistent-type-assertions
      ;(doc as any)[collection] = result
      return result
    }
    return result
  }

  async findAll<T extends Doc>(_class: Ref<Class<T>>, query: Partial<Data<T>> & Partial<Doc>): Promise<T[]> {
    let result: Doc[]
    if (query._id !== undefined) {
      const obj = this.objectById.get(query._id)
      result = obj !== undefined ? [obj] : []
    } else {
      result = this.getObjectsByClass(_class)
    }

    for (const key in query) {
      if (key === '_id') continue
      const value = (query as any)[key]
      result = findProperty(result, key, value)
    }
    return result as T[]
  }

  addDoc (doc: Doc): void {
    this.hierarchy.getAncestors(doc._class).forEach((_class) => {
      this.getObjectsByClass(_class).push(doc)
    })
    this.objectById.set(doc._id, doc)
  }
}

export class TxDb extends MemDb implements Storage {
  async tx (tx: Tx): Promise<void> {
    this.addDoc(tx)
  }
}

export class ModelDb extends TxProcessor implements Storage {
  private readonly db: MemDb

  constructor (hierarchy: Hierarchy) {
    super()
    this.db = new MemDb(hierarchy)
  }

  async findAll <T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>): Promise<T[]> {
    return await this.db.findAll<T>(_class, query)
  }

  protected async txCreateDoc (tx: TxCreateDoc<Doc>): Promise<void> {
    this.db.addDoc({
      _id: tx.objectId,
      _class: tx.objectClass,
      ...tx.attributes
    })
  }

  protected async txAddCollection (tx: TxAddCollection<Emb>): Promise<void> {
    ;(this.db.getCollection(tx.objectId, tx.collection) as any)[tx.localId ?? generateId()] = tx.attributes
  }
}
