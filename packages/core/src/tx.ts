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

import type { KeysByType } from 'simplytyped'
import type { Class, Data, Doc, Domain, Ref, Account, Space, Arr } from './classes'
import core from './component'
import { generateId } from './utils'
import { createShortRef } from './shortref'
import { Storage } from './storage'

export interface Tx<T extends Doc = Doc> extends Doc {
  objectId: Ref<T>
  objectSpace: Ref<Space>
}

export interface TxCreateDoc<T extends Doc> extends Tx<T> {
  objectClass: Ref<Class<T>>
  attributes: Data<T>
}

type ArrayAsElement<T extends Doc> = {
  [P in keyof T]: T[P] extends Arr<infer X> ? X : never
}

type OmitNever<T extends object> = Omit<T, KeysByType<T, never>>

interface PushOptions<T extends Doc> {
  $push?: Partial<OmitNever<ArrayAsElement<T>>>
}

export type DocumentUpdate<T extends Doc> = Partial<Data<T>> & PushOptions<T>

export interface TxUpdateDoc<T extends Doc> extends Tx<T> {
  objectClass: Ref<Class<T>>
  operations: DocumentUpdate<T>
}

export interface TxRemoveDoc<T extends Doc> extends Tx<T> {
  objectClass: Ref<Class<T>>
}

export const DOMAIN_TX = 'tx' as Domain

export class TxProcessor {
  async tx (tx: Tx): Promise<void> {
    switch (tx._class) {
      case core.class.TxCreateDoc:
        return await this.txCreateDoc(tx as TxCreateDoc<Doc>)
      case core.class.TxUpdateDoc:
        return await this.txUpdateDoc(tx as TxUpdateDoc<Doc>)
      case core.class.TxRemoveDoc:
        return await this.txRemoveDoc(tx as TxRemoveDoc<Doc>)
    }
  }

  static createDoc2Doc (tx: TxCreateDoc<Doc>): Doc {
    return {
      _id: tx.objectId,
      _class: tx.objectClass,
      space: tx.objectSpace,
      modifiedBy: tx.modifiedBy,
      modifiedOn: tx.modifiedOn,
      ...tx.attributes
    }
  }

  protected async txCreateDoc (tx: TxCreateDoc<Doc>): Promise<void> {}
  protected async txUpdateDoc (tx: TxUpdateDoc<Doc>): Promise<void> {}
  protected async txRemoveDoc (tx: TxRemoveDoc<Doc>): Promise<void> {}
}

export interface TxOperations {
  accountId: () => Ref<Account>
  createDoc: <T extends Doc>(
    _class: Ref<Class<T>>,
    space: Ref<Space>,
    attributes: Data<T>,
    objectId?: Ref<T>
  ) => Promise<T>
  createShortRef: <T extends Doc>(_id: Ref<T>, _class: Ref<Class<T>>, space: Ref<Space>) => Promise<string | undefined>
  updateDoc: <T extends Doc>(
    _class: Ref<Class<T>>,
    space: Ref<Space>,
    objectId: Ref<T>,
    operations: DocumentUpdate<T>
  ) => Promise<void>
  removeDoc: <T extends Doc>(_class: Ref<Class<T>>, space: Ref<Space>, objectId: Ref<T>) => Promise<void>
}

export function withOperations<T extends Storage> (user: Ref<Account>, storage: T): T & TxOperations {
  const result = storage as T & TxOperations

  result.accountId = () => user

  result.createDoc = async <T extends Doc>(
    _class: Ref<Class<T>>,
    space: Ref<Space>,
    attributes: Data<T>,
    objectId?: Ref<T>
  ): Promise<T> => {
    const tx: TxCreateDoc<T> = {
      _id: generateId(),
      _class: core.class.TxCreateDoc,
      space: core.space.Tx,
      modifiedBy: user,
      modifiedOn: Date.now(),
      objectId: objectId ?? generateId(),
      objectClass: _class,
      objectSpace: space,
      attributes
    }
    await storage.tx(tx)
    return TxProcessor.createDoc2Doc(tx) as T
  }

  result.createShortRef = async <T extends Doc>(
    _id: Ref<T>,
    _class: Ref<Class<T>>,
    space: Ref<Space>
  ): Promise<string | undefined> => {
    const objectSpace = (await storage.findAll(core.class.Space, { _id: space }, { limit: 1 }))[0]
    const workspace = objectSpace.name
      .trim()
      .toUpperCase()
      .replace(/[^a-z0-9]/gim, '_')
      .replace(/[_]/g, '_')
    return await createShortRef(storage, user, space, _id, _class, workspace)
  }

  result.updateDoc = async <T extends Doc>(
    _class: Ref<Class<T>>,
    space: Ref<Space>,
    objectId: Ref<T>,
    operations: DocumentUpdate<T>
  ): Promise<void> => {
    const tx: TxUpdateDoc<T> = {
      _id: generateId(),
      _class: core.class.TxUpdateDoc,
      space: core.space.Tx,
      modifiedBy: user,
      modifiedOn: Date.now(),
      objectId,
      objectClass: _class,
      objectSpace: space,
      operations
    }
    await storage.tx(tx)
  }

  result.removeDoc = async <T extends Doc>(
    _class: Ref<Class<T>>,
    space: Ref<Space>,
    objectId: Ref<T>
  ): Promise<void> => {
    const tx: TxRemoveDoc<T> = {
      _id: generateId(),
      _class: core.class.TxRemoveDoc,
      space: core.space.Tx,
      modifiedBy: user,
      modifiedOn: Date.now(),
      objectId,
      objectClass: _class,
      objectSpace: space
    }
    await storage.tx(tx)
  }

  return result
}
