import core, {
  Class,
  Doc,
  DocumentQuery,
  DOMAIN_MODEL,
  DOMAIN_TX,
  Emb,
  Hierarchy,
  Obj,
  Ref,
  Storage,
  Tx,
  TxAddCollection,
  TxCreateDoc,
  TxUpdateCollection,
  TxUpdateDoc
} from '@anticrm/core'

export class WorkspaceStorage implements Storage {
  constructor (readonly hierarchy: Hierarchy, readonly txStore: Storage, readonly doc: Storage) {}

  txStorage (): Storage {
    return this.txStore
  }

  txObjectClass (tx: Tx<Doc>): Ref<Class<Obj>> {
    if (this.hierarchy.isDerived(tx._class, core.class.TxCreateDoc)) {
      return (tx as TxCreateDoc<Doc>).objectClass
    }
    if (this.hierarchy.isDerived(tx._class, core.class.TxUpdateDoc)) {
      return (tx as TxUpdateDoc<Doc>).objectClass
    }
    if (this.hierarchy.isDerived(tx._class, core.class.TxAddCollection)) {
      return (tx as TxAddCollection<Doc, Emb>).itemClass
    }
    if (this.hierarchy.isDerived(tx._class, core.class.TxUpdateCollection)) {
      return (tx as TxUpdateCollection<Doc, Emb>).itemClass
    }

    throw new Error(`Tx has no objectClass defined ${tx._class}`)
  }

  async findAll<T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>): Promise<T[]> {
    const domain = this.hierarchy.getDomain(_class)
    switch (domain) {
      case DOMAIN_TX:
        return await this.txStore.findAll(_class, query)
      case DOMAIN_MODEL:
        return [] // Model is rebuild from  transactions, so no need to return anyting.
      default:
        return await this.doc.findAll(_class, query)
    }
  }

  async tx (tx: Tx): Promise<void> {
    await this.txStore.tx(tx) // In any case send into transaction storage.

    const domain = this.hierarchy.getDomain(this.txObjectClass(tx))
    switch (domain) {
      case DOMAIN_TX:
        return // No need since already performed.
      case DOMAIN_MODEL:
        return // Model is rebuild from  transactions, so no need to return anyting.
      default:
        return await this.doc.tx(tx)
    }
  }
}
