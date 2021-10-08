import {
  Class,
  Doc,
  DocumentQuery,
  DOMAIN_MODEL,
  DOMAIN_TX,
  FindOptions,
  FindResult,
  Hierarchy,
  isDerivedDataTx,
  isModelTx,
  Ref,
  Storage,
  Tx
} from '@anticrm/core'

/**
 * @public
 */
export class WorkspaceStorage implements Storage {
  constructor (readonly hierarchy: Hierarchy, readonly txStore: Storage, readonly doc: Storage) {}

  async findAll<T extends Doc>(
    _class: Ref<Class<T>>,
    query: DocumentQuery<T>,
    options?: FindOptions<T>
  ): Promise<FindResult<T>> {
    const domain = this.hierarchy.getDomain(_class)
    if (domain === DOMAIN_TX) {
      return await this.txStore.findAll(_class, query, options)
    }
    return domain === DOMAIN_MODEL ? Object.assign([], { total: 0 }) : await this.doc.findAll(_class, query, options)
  }

  async tx (tx: Tx): Promise<void> {
    if (!isModelTx(tx)) {
      await this.doc.tx(tx)
    }

    if (isDerivedDataTx(tx, this.hierarchy)) {
      return
    }

    await this.txStore.tx(tx) // In any case send into transaction storage.
  }
}
