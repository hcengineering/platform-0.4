import core, { Class, Doc, DocumentQuery, DOMAIN_TX, Hierarchy, Ref, Tx } from '@anticrm/core'
import { DocStorage, TxStorage } from '@anticrm/mongo'
import { MongoClientOptions } from 'mongodb'
import { dropDomain, dropWorkspace, dumpDomain, initMongoConnection } from './mongo'
import { WorkspaceStorage } from './storage'

/**
 * Some extra transaction processing operations.
 */
export interface TxHandler {
  tx: (tx: Tx) => Promise<void>
}

/**
 * Workspace initialization options.
 *
 * Options available now:
 *
 * - MONGO_URI - MongoDB Uri
 */
export interface WorkspaceOptions {
  mongoDBUri: string // Mongo DB URI.
  mongoOptions?: any // Any other mongo options, should be compatible with @{link MongoClientOptions}
}

/**
 * Represent a workspace.
 * Before find*, tx operations could be used, consider initialize Db with model transactions.
 */
export class Workspace {
  static async create (
    workspaceId: string,
    options: WorkspaceOptions,
    txh?: (hierarchy: Hierarchy) => TxHandler[]
  ): Promise<Workspace> {
    const hierarchy: Hierarchy = new Hierarchy()
    const db = await initMongoConnection(workspaceId, options.mongoDBUri, options.mongoOptions as MongoClientOptions)

    const txStorage = new TxStorage(db.collection('tx'), hierarchy)
    const mongoDocStorage = new DocStorage(db, hierarchy)

    // Load hierarchy from transactions.
    const transactions = (await dumpDomain(workspaceId, DOMAIN_TX)) as Tx[]
    for (const tx of transactions) {
      hierarchy.tx(tx) // we could cast since we sure all documents are Tx based.
    }

    const storage = new WorkspaceStorage(hierarchy, txStorage, mongoDocStorage)

    return new Workspace(workspaceId, hierarchy, storage, txh !== undefined ? txh(hierarchy) : [])
  }

  private constructor (
    readonly workspaceId: string,
    readonly hierarchy: Hierarchy,
    readonly storage: WorkspaceStorage,
    readonly txh: TxHandler[]
  ) {}

  getHierarchy (): Hierarchy {
    return this.hierarchy
  }

  async findAll<T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>): Promise<T[]> {
    const result = await this.storage.findAll(_class, query)
    return result
  }

  async tx (tx: Tx): Promise<void> {
    this.hierarchy.tx(tx)
    await (await this.storage).tx(tx)

    await Promise.all(this.txh.map(async (t) => await t.tx(tx)))
  }

  async initialize (transactions: Tx[]): Promise<void> {
    await dropDomain(this.workspaceId, DOMAIN_TX, { objectSpace: core.space.Model })
    const txStore = this.storage.txStorage()
    for (const tx of transactions) {
      this.hierarchy.tx(tx)
      await txStore.tx(tx)
    }
  }

  async cleanup (): Promise<void> {
    await dropWorkspace(this.workspaceId)
  }
}
// This need this export to not hang on jest tests
export { shutdown } from './mongo'
