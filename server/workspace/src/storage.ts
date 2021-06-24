import core, {
  Class,
  Doc,
  DocumentQuery,
  DOMAIN_MODEL,
  DOMAIN_TX,
  Hierarchy,
  Obj,
  Ref,
  Storage,
  Tx,
  TxCreateDoc,
  TxUpdateDoc
} from '@anticrm/core'

export class WorkspaceStorage implements Storage {
  txHandlers: Array<{ id: Ref<Class<Tx>>, tx: (tx: Tx) => Ref<Class<Doc>> }> = [
    { id: core.class.TxCreateDoc, tx: (tx: Tx) => (tx as TxCreateDoc<Doc>).objectClass },
    { id: core.class.TxUpdateDoc, tx: (tx: Tx) => (tx as TxUpdateDoc<Doc>).objectClass }
  ]

  constructor (readonly hierarchy: Hierarchy, readonly txStore: Storage, readonly doc: Storage) {}

  txStorage (): Storage {
    return this.txStore
  }

  txObjectClass (tx: Tx<Doc>): Ref<Class<Obj>> {
    for (const h of this.txHandlers) {
      if (this.hierarchy.isDerived(tx._class, h.id)) {
        return h.tx(tx)
      }
    }
    throw new Error(`Tx has no objectClass defined ${tx._class}`)
  }

  async findAll<T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>): Promise<T[]> {
    const domain = this.hierarchy.getDomain(_class)
    if (domain === DOMAIN_TX) {
      return await this.txStore.findAll(_class, query)
    }
    return domain === DOMAIN_MODEL ? [] : await this.doc.findAll(_class, query)
  }

  async tx (tx: Tx): Promise<void> {
    await this.txStore.tx(tx) // In any case send into transaction storage.

    const domain = this.hierarchy.getDomain(this.txObjectClass(tx))
    if (domain === DOMAIN_TX || domain === DOMAIN_MODEL) {
      return // No need since already performed or not required
    }
    return await this.doc.tx(tx)
  }
}
