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

import core, { Class, Doc, Space, DocumentQuery, Ref, Storage, Tx, Account, TxCreateDoc, TxAddCollection, Emb, TxProcessor, makeEmb, Member, Hierarchy, DOMAIN_MODEL, DOMAIN_TX } from '@anticrm/core'

export class SecurityModel extends TxProcessor {
  private readonly hierarchy: Hierarchy
  private readonly allowedSpaces: Map<Ref<Account>, Set<Ref<Space>>> = new Map<Ref<Account>, Set<Ref<Space>>>()
  private readonly publicSpaces: Set<Ref<Space>> = new Set<Ref<Space>>()

  constructor (hierarchy: Hierarchy) {
    super()
    this.hierarchy = hierarchy
  }

  protected async txCreateDoc (tx: TxCreateDoc<Doc>): Promise<void> {
    if (this.hierarchy.isDerived(tx.objectClass, core.class.Space)) {
      const obj = TxProcessor.createDoc2Doc(tx) as Space
      if (!obj.private) this.publicSpaces.add(tx.objectId as Ref<Space>)
    }
  }

  protected async txAddCollection (tx: TxAddCollection<Doc, Emb>): Promise<void> {
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

  checkSecurity (userId: Ref<Account>, space: Ref<Space>): boolean {
    const spaces = this.allowedSpaces.get(userId)
    if (spaces === undefined || spaces.size === 0) return false
    if (!spaces.has(space)) return false
    return true
  }

  getSpaces (userId: Ref<Account>): Set<Ref<Space>> {
    return new Set<Ref<Space>>([...this.publicSpaces, ...this.allowedSpaces.get(userId) ?? []])
  }
}

export class SecurityStorage implements Storage {
  private readonly storage: Storage
  private readonly hierarchy: Hierarchy
  private readonly securityModel: SecurityModel
  private readonly userId: Ref<Account>

  constructor (storage: Storage, hierarchy: Hierarchy, securityModel: SecurityModel, userId: Ref<Account>) {
    this.storage = storage
    this.hierarchy = hierarchy
    this.securityModel = securityModel
    this.userId = userId
  }

  async findAll<T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>): Promise<T[]> {
    const domain = this.hierarchy.getDomain(_class)
    if (domain === DOMAIN_MODEL || domain === DOMAIN_TX) return await this.storage.findAll(_class, query)
    const querySpace = (query as DocumentQuery<Doc>).space
    const spaces = this.securityModel.getSpaces(this.userId)
    if (spaces === undefined || spaces.size === 0) throw new Error('Access denied')
    if (querySpace !== undefined) {
      if (typeof querySpace === 'string') {
        if (!spaces.has(querySpace)) throw new Error('Access denied')
      } else {
        if ((querySpace.$in?.every((space) => spaces.has(space))) === false) throw new Error('Access denied')
      }
    } else {
      (query as any).space = { $in: [...spaces.values()] }
    }
    return await this.storage.findAll(_class, query)
  }

  async tx (tx: Tx): Promise<void> {
    let domain
    switch (tx._class) {
      case core.class.TxCreateDoc:
        domain = this.hierarchy.getDomain((tx as TxCreateDoc<Doc>).objectClass)
        break
      case core.class.TxAddCollection:
        domain = this.hierarchy.getDomain((tx as TxAddCollection<Doc, Emb>).itemClass)
        break
    }
    if (domain === DOMAIN_MODEL || domain === DOMAIN_TX) return await this.storage.tx(tx)
    if (!this.securityModel.checkSecurity(this.userId, tx.objectSpace)) throw new Error('Access denied')
    return await this.storage.tx(tx)
  }
}
