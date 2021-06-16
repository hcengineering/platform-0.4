import core, { Class, Doc, Hierarchy, Ref, Storage, Tx, DocumentQuery } from '@anticrm/core'

export class TxDispatcherStorage implements Storage {
  constructor (readonly hierarchy: Hierarchy, readonly txStore: Storage, readonly docStore: Storage) {}

  async findAll<T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>): Promise<T[]> {
    if (this.hierarchy.isDerived(_class, core.class.Tx)) {
      // This is tx
      return await this.txStore.findAll(_class, query)
    }
    return await this.docStore.findAll(_class, query)
  }

  async tx (tx: Tx): Promise<void> {
    await this.hierarchy.tx(tx)

    await this.txStore.tx(tx)
    await this.docStore.tx(tx)
  }
}
