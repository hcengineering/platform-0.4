import core, {
  Class,
  Doc,
  DocumentQuery,
  DOMAIN_MODEL,
  DOMAIN_TX,
  FindResult,
  Hierarchy,
  isModelTx,
  Ref,
  Storage,
  Tx,
  txObjectClass
} from '@anticrm/core'

/**
 * @public
 */
export class WorkspaceStorage implements Storage {
  constructor (readonly hierarchy: Hierarchy, readonly txStore: Storage, readonly doc: Storage) {}

  async findAll<T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>): Promise<FindResult<T>> {
    const domain = this.hierarchy.getDomain(_class)
    if (domain === DOMAIN_TX) {
      return await this.txStore.findAll(_class, query)
    }
    return domain === DOMAIN_MODEL ? Object.assign([], { total: 0 }) : await this.doc.findAll(_class, query)
  }

  async tx (tx: Tx): Promise<void> {
    if (!isModelTx(tx)) {
      await this.doc.tx(tx)
    }

    const objectClass = txObjectClass(tx)
    // Do not store transaction for derived data objects.
    if (objectClass !== undefined && this.hierarchy.isDerived(objectClass, core.class.DerivedData)) {
      return
    }

    await this.txStore.tx(tx) // In any case send into transaction storage.
  }
}
