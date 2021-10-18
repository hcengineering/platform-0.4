import { CoreClient, isDerivedDataTx } from '..'
import { Account, Class, Doc, Ref } from '../classes'
import core from '../component'
import { Hierarchy } from '../hierarchy'
import { DocumentQuery, FindOptions, FindResult, Storage } from '../storage'
import { DOMAIN_TX, Tx } from '../tx'

class TxModelStorage implements CoreClient {
  constructor (readonly hierarchy: Hierarchy, readonly txStore: Storage, readonly doc: Storage) {}

  async accountId (): Promise<Ref<Account>> {
    return core.account.System
  }

  txStorage (): Storage {
    return this.txStore
  }

  async close (): Promise<void> {}

  async findAll<T extends Doc>(
    _class: Ref<Class<T>>,
    query: DocumentQuery<T>,
    options?: FindOptions<T>
  ): Promise<FindResult<T>> {
    const domain = this.hierarchy.getDomain(_class)
    if (domain === DOMAIN_TX) {
      return await this.txStore.findAll(_class, query, options)
    }
    return await this.doc.findAll(_class, query, options)
  }

  async tx (tx: Tx): Promise<void> {
    await this.doc.tx(tx)
    if (isDerivedDataTx(tx, this.hierarchy)) {
      return
    }
    await this.txStore.tx(tx) // In any case send into transaction storage.
  }
}

/**
 * @public
 */
export function createTestTxAndDocStorage (hierarchy: Hierarchy, txStore: Storage, doc: Storage): CoreClient {
  return new TxModelStorage(hierarchy, txStore, doc)
}
