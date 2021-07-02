import { Class, Doc, DocumentQuery, DOMAIN_TX, FindResult, Hierarchy, Ref, Storage, Tx } from '@anticrm/core'
import { DocStorage, getMongoClient, TxStorage } from '@anticrm/mongo'
import { MongoClientOptions } from 'mongodb'
import { WorkspaceStorage } from './storage'

/**
 * Some extra transaction processing operations.
 */
export interface TxHandler {
  tx: (tx: Tx) => Promise<void>
}

/**
 * Workspace connection options.
 */
export interface WorkspaceOptions {
  mongoDBUri: string // Mongo DB URI.
  mongoOptions?: any // Any other mongo options, should be compatible with @{link MongoClientOptions}
}

/**
 * Represent a workspace.
 * Before find*, tx operations could be used, consider initialize Db with model transactions.
 */
export class Workspace implements Storage {
  static async create (
    workspaceId: string,
    options: WorkspaceOptions,
    txh?: (hierarchy: Hierarchy, storage: Storage) => TxHandler[]
  ): Promise<Workspace> {
    const hierarchy: Hierarchy = new Hierarchy()
    const db = (await getMongoClient(options.mongoDBUri, options.mongoOptions as MongoClientOptions)).db(
      'ws-' + workspaceId
    )

    const txStorage = new TxStorage(db.collection(DOMAIN_TX as string), hierarchy)
    const mongoDocStorage = new DocStorage(db, hierarchy)

    // Load hierarchy from transactions.
    const transactions = (await db
      .collection(DOMAIN_TX as string)
      .find({})
      .toArray()) as Tx[]
    for (const tx of transactions) {
      hierarchy.tx(tx) // we could cast since we sure all documents are Tx based.
    }

    const storage = new WorkspaceStorage(hierarchy, txStorage, mongoDocStorage)

    return new Workspace(workspaceId, hierarchy, storage, txh !== undefined ? txh(hierarchy, storage) : [])
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

  async findAll<T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>): Promise<FindResult<T>> {
    const result = await this.storage.findAll(_class, query)
    return result
  }

  async tx (tx: Tx): Promise<void> {
    this.hierarchy.tx(tx)
    await (await this.storage).tx(tx)

    await Promise.all(this.txh.map(async (t) => await t.tx(tx)))
  }
}

// This need this export to not hang on jest tests
export { shutdown } from '@anticrm/mongo'
