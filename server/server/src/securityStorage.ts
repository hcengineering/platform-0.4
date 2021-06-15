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

import core, { Class, Doc, Space, DocumentQuery, Ref, Storage, Tx, Account, TxCreateDoc, TxAddCollection, Emb, TxProcessor, makeEmb, Member, Hierarchy } from '@anticrm/core'

export class SecurityStorage {
  private readonly storage: Storage
  private readonly hierarchy: Hierarchy
  private readonly allowedSpaces: Map<Ref<Account>, Set<Ref<Space>>> = new Map<Ref<Account>, Set<Ref<Space>>>()
  private readonly publicSpaces: Set<Ref<Space>> = new Set<Ref<Space>>()

  constructor (storage: Storage, hierarchy: Hierarchy) {
    this.storage = storage
    this.hierarchy = hierarchy
  }

  async findAll<T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>, userId: Ref<Account>): Promise<T[]> {
    if (this.hierarchy.isDerived(_class, core.class.Space)) return await this.storage.findAll(_class, query)
    const querySpace = (query as any).space as Ref<Space>
    const spaces = new Set<Ref<Space>>([...this.publicSpaces, ...this.allowedSpaces.get(userId) ?? []])
    if (querySpace !== undefined) {
      if (spaces === undefined || spaces.size === 0) throw new Error('Access denied')
      if (!spaces.has(querySpace)) throw new Error('Access denied')
    } else {
      if (spaces !== undefined) {
        (query as any).space = [...spaces.values()]
      }
    }
    return await this.storage.findAll(_class, query)
  }

  async tx (tx: Tx, userId: Ref<Account>): Promise<void> {
    if (core.space.Model === tx.objectSpace) {
      switch (tx._class) {
        case core.class.TxCreateDoc:
          this.txCreateDoc(tx as TxCreateDoc<Doc>)
          break
        case core.class.TxAddCollection:
          this.txAddCollection(tx as TxAddCollection<Doc, Emb>)
          break
      }
    } else {
      this.check(userId, tx.objectSpace)
    }
    return await this.storage.tx(tx)
  }

  private txCreateDoc (tx: TxCreateDoc<Doc>): void {
    if (this.hierarchy.isDerived(tx.objectClass, core.class.Space)) {
      const obj = TxProcessor.createDoc2Doc(tx) as Space
      if (!obj.private) this.publicSpaces.add(tx.objectId as Ref<Space>)
    }
  }

  private txAddCollection (tx: TxAddCollection<Doc, Emb>): void {
    if (this.hierarchy.isDerived(tx.itemClass, core.class.Space)) {
      if (tx.collection === 'members') {
        const obj = makeEmb(
          tx.itemClass,
          tx.attributes
        ) as Member
        const accountSpaces = this.allowedSpaces.get(obj.account)
        if (accountSpaces === undefined) {
          this.allowedSpaces.set(obj.account, new Set<Ref<Space>>([tx.objectId as Ref<Space>]))
        } else {
          accountSpaces.add(tx.objectId as Ref<Space>)
        }
      }
    }
  }

  private check (userId: Ref<Account>, space: Ref<Space>): void {
    const spaces = this.allowedSpaces.get(userId)
    if (spaces === undefined || spaces.size === 0) throw new Error('Access denied')
    if (!spaces.has(space)) throw new Error('Access denied')
  }
}
