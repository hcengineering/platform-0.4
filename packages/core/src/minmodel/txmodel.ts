import { FileOp, WithFiles } from '..'
import { Account, Class, Doc, Ref } from '../classes'
import core from '../component'
import { Hierarchy } from '../hierarchy'
import { DocumentQuery, FindOptions, FindResult, Storage } from '../storage'
import { DOMAIN_TX, Tx } from '../tx'

class TxModelStorage implements WithFiles {
  constructor (readonly hierarchy: Hierarchy, readonly txStore: Storage, readonly doc: Storage) {}

  async accountId (): Promise<Ref<Account>> {
    return core.account.System
  }

  txStorage (): Storage {
    return this.txStore
  }

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

    await this.txStore.tx(tx) // In any case send into transaction storage.
  }

  async file (op: FileOp): Promise<string> {
    throw new Error('Not implemented')
  }
}

/**
 * @internal
 */
export function _createTestTxAndDocStorage (hierarchy: Hierarchy, txStore: Storage, doc: Storage): WithFiles {
  return new TxModelStorage(hierarchy, txStore, doc)
}
