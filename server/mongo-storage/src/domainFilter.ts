import core, { Class, Doc, Hierarchy, Ref, Storage, Tx, TxUpdateDoc } from '@anticrm/core'
import { Domain, Emb } from '@anticrm/core/src/classes'
import { TxAddCollection, TxCreateDoc, TxUpdateCollection } from '@anticrm/core/src/tx'
import { TxStorage } from './tx'

/**
 * Will do not pass transactions over model classes.
 */
export class ModelFilter implements Storage {
  constructor (readonly filterDomain: Domain, readonly hierarchy: Hierarchy, readonly store: TxStorage) {
  }

  async findAll <T extends Doc>(_class: Ref<Class<T>>, query: Partial<T>): Promise<T[]> {
    return await this.store.findAll(_class, query)
  }

  async tx (tx: Tx): Promise<void> {
    let domain: Domain | undefined
    try {
      switch (tx._class) {
        case core.class.TxCreateDoc:
          domain = this.hierarchy.getDomain((tx as TxCreateDoc<Doc>).objectClass)
          break
        case core.class.TxUpdateDoc:
          domain = this.hierarchy.getDomain((tx as TxUpdateDoc<Doc>).objectClass)
          break
        case core.class.TxAddCollection:
          domain = this.hierarchy.getDomain((tx as TxAddCollection<Doc, Emb>).itemClass)
          break
        case core.class.TxUpdateCollection:
          domain = this.hierarchy.getDomain((tx as TxUpdateCollection<Doc, Emb>).itemClass)
          break
      }
      if (this.filterDomain === domain) {
        return await Promise.resolve()
      }
    } catch (ex) {
      // If no domain yet we assume it is model class.
      return await Promise.resolve()
    }

    await this.store.tx(tx)
  }
}
