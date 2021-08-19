import core, {
  ModelDb,
  Class,
  Doc,
  DocumentQuery,
  DOMAIN_TX,
  FindResult,
  Hierarchy,
  Ref,
  Storage,
  Tx
} from '@anticrm/core'
import { DocStorage, getMongoClient, TxStorage, mongoUnescape, mongoReplaceNulls } from '@anticrm/mongo'
import { MongoClientOptions } from 'mongodb'
import { WorkspaceStorage } from './storage'

/**
 * Some extra transaction processing operations.
 * @public
 */
export interface TxHandler {
  tx: (tx: Tx) => Promise<void>
}

/**
 * @public
 */
export type TxHandlerFactory = (hierarchy: Hierarchy, storage: Storage, model: ModelDb) => Promise<TxHandler[]>

/**
 * Workspace connection options.
 * @public
 */
export interface WorkspaceOptions {
  mongoDBUri: string // Mongo DB URI.
  mongoOptions?: any // Any other mongo options, should be compatible with @{link MongoClientOptions}
}

/**
 * Represent a workspace.
 * Before find*, tx operations could be used, consider initialize Db with model transactions.
 * @public
 */
export class Workspace implements Storage {
  static async create (workspaceId: string, options: WorkspaceOptions, txh?: TxHandlerFactory): Promise<Workspace> {
    const hierarchy: Hierarchy = new Hierarchy()
    const model = new ModelDb(hierarchy)
    const db = (await getMongoClient(options.mongoDBUri, options.mongoOptions as MongoClientOptions)).db(
      'ws-' + workspaceId
    )

    const txStorage = new TxStorage(db.collection(DOMAIN_TX as string), hierarchy)
    const mongoDocStorage = new DocStorage(db, hierarchy)

    // Load hierarchy from transactions.
    const txCollection = db.collection(DOMAIN_TX as string)
    const transactions: Tx[] = (await txCollection.find({}).toArray())
      .map(mongoUnescape)
      .map(mongoReplaceNulls)

    for (const tx of transactions) {
      hierarchy.tx(tx)
    }
    for (const tx of transactions) {
      await model.tx(tx)
    }

    const storage = new WorkspaceStorage(hierarchy, txStorage, mongoDocStorage)

    const modelTx: TxHandler = {
      tx: async (tx) => {
        if (tx.objectSpace === core.space.Model) {
          await model.tx(tx)
        }
      }
    }

    const handlers: TxHandler[] = txh !== undefined ? [model, ...(await txh(hierarchy, storage, model))] : [modelTx]
    return new Workspace(workspaceId, hierarchy, storage, handlers, model)
  }

  private constructor (
    readonly workspaceId: string,
    readonly hierarchy: Hierarchy,
    private readonly storage: WorkspaceStorage,
    readonly txh: TxHandler[],
    readonly model: ModelDb
  ) {}

  getHierarchy (): Hierarchy {
    return this.hierarchy
  }

  async findAll<T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>): Promise<FindResult<T>> {
    const result = await this.storage.findAll(_class, query)
    return result
  }

  async tx (tx: Tx): Promise<void> {
    // 1. go to storage to check for potential object duplicate transactions.
    await (await this.storage).tx(tx)

    // 2. update hierarchy
    if (tx.objectSpace === core.space.Model) {
      this.hierarchy.tx(tx)
    }

    // 3. process all other transaction handlers
    await Promise.all(this.txh.map(async (t) => await t.tx(tx)))
  }
}

// This need this export to not hang on jest tests
/**
 * @public
 */
export { shutdown } from '@anticrm/mongo'
