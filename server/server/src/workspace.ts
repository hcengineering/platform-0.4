import { Class, Doc, DocumentQuery, Hierarchy, Ref, Storage, Tx } from '@anticrm/core'
import { SecurityModel } from './security'
import { ShutdownOperation } from './server'

export interface ClientInfo {
  clientId: string
  accountId: string
  workspaceId: string
  tx: (tx: Tx) => void
  close: ShutdownOperation
}

export interface TxHandler {
  tx: (tx: Tx) => Promise<void>
}

export class Workspace {
  clients = new Map<string, ClientInfo>()

  constructor (
    readonly hierarchy: Hierarchy,
    readonly storage: Storage,
    readonly txes: TxHandler[],
    readonly close: () => Promise<void>,
    readonly security: SecurityModel
  ) {}

  getHierarchy (): Hierarchy {
    return this.hierarchy
  }

  getSecurity (): SecurityModel {
    return this.security
  }

  async findAll<T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>): Promise<T[]> {
    const result = await this.storage.findAll(_class, query)
    console.log('execute query', _class, query, result)
    return result
  }

  async tx (tx: Tx): Promise<void> {
    await Promise.all(this.txes.map(async (t) => await t.tx(tx)))
  }

  async shutdown (): Promise<void> {
    await this.close()
  }
}
