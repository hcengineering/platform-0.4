import core, {
  Class,
  Doc,
  DocumentQuery,
  DOMAIN_MODEL,
  DOMAIN_TX,
  FindResult,
  Hierarchy,
  Ref,
  Storage,
  Tx
} from '@anticrm/core'

export class WorkspaceStorage implements Storage {
  constructor (readonly hierarchy: Hierarchy, readonly txStore: Storage, readonly doc: Storage) {}

  txStorage (): Storage {
    return this.txStore
  }

  async findAll<T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>): Promise<FindResult<T>> {
    const domain = this.hierarchy.getDomain(_class)
    if (domain === DOMAIN_TX) {
      return await this.txStore.findAll(_class, query)
    }
    return domain === DOMAIN_MODEL ? Object.assign([], { total: 0 }) : await this.doc.findAll(_class, query)
  }

  async tx (tx: Tx): Promise<void> {
    await this.txStore.tx(tx) // In any case send into transaction storage.

    const domain = this.hierarchy.getDomainByTx(tx)
    if (domain === DOMAIN_TX || domain === DOMAIN_MODEL) {
      return // No need since already performed or not required
    }
    return await this.doc.tx(tx)
  }
}
