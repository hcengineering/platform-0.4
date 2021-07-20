import { Class, Doc, Ref } from '../classes'
import { Hierarchy } from '../hierarchy'
import { DocumentQuery, FindResult, Storage } from '../storage'
import { DOMAIN_TX, Tx } from '../tx'

export class TxModelStorage implements Storage {
  constructor (readonly hierarchy: Hierarchy, readonly txStore: Storage, readonly doc: Storage) {}

  txStorage (): Storage {
    return this.txStore
  }

  async findAll<T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>): Promise<FindResult<T>> {
    const domain = this.hierarchy.getDomain(_class)
    if (domain === DOMAIN_TX) {
      return await this.txStore.findAll(_class, query)
    }
    return await this.doc.findAll(_class, query)
  }

  async tx (tx: Tx): Promise<void> {
    await this.doc.tx(tx)

    await this.txStore.tx(tx) // In any case send into transaction storage.
  }
}
