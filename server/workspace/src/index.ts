import core, {
  Class,
  Doc,
  DocumentQuery,
  DOMAIN_TX,
  FindOptions,
  FindResult,
  Hierarchy,
  isModelTx,
  measure,
  measureAsync,
  ModelDb,
  Ref,
  Storage,
  Tx
} from '@anticrm/core'
import { DocStorage, getMongoClient, mongoReplaceNulls, mongoUnescape, TxStorage } from '@anticrm/mongo'
import { MongoClientOptions } from 'mongodb'
import { WorkspaceStorage } from './storage'

/**
 * Some extra transaction processing operations.
 * @public
 */
export interface TxHandler {
  name: string
  tx: (clientId: string, tx: Tx) => Promise<void>
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
 * @public
 */
export interface WithWorkspaceTx extends Omit<Storage, 'tx'> {
  tx: (clientId: string, tx: Tx) => Promise<void>
}

/**
 * Represent a workspace.
 * Before find*, tx operations could be used, consider initialize Db with model transactions.
 * @public
 */
export class Workspace implements WithWorkspaceTx {
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

    // We only need model global transactions.
    const transactions: Tx[] = (
      await txCollection.find({ space: core.space.Tx, objectSpace: core.space.Model }).toArray()
    )
      .map(mongoUnescape)
      .map(mongoReplaceNulls)

    transactions.forEach((tx) => hierarchy.tx(tx))

    for (const tx of transactions) {
      await model.tx(tx)
    }

    const storage = new WorkspaceStorage(hierarchy, txStorage, mongoDocStorage)

    const modelTx: TxHandler = {
      name: 'model',
      tx: async (clientId, tx) => {
        // Update model only for global model transactions.
        if (isModelTx(tx)) {
          await model.tx(tx)
        }
      }
    }

    const handlers: TxHandler[] = txh !== undefined ? [modelTx, ...(await txh(hierarchy, storage, model))] : [modelTx]
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

  async findAll<T extends Doc>(
    _class: Ref<Class<T>>,
    query: DocumentQuery<T>,
    options?: FindOptions<T>
  ): Promise<FindResult<T>> {
    return await this.storage.findAll(_class, query, options)
  }

  async tx (clientId: string, tx: Tx): Promise<void> {
    // 1. go to storage to check for potential object duplicate transactions.
    const stx = measure('workspace.storage.tx')
    const result = await this.storage.tx(tx)
    stx()

    // 2. update hierarchy only for global model transactions only.
    if (isModelTx(tx) && tx.space === core.space.Tx) {
      const htx = measure('workspace.hierarchy.tx')
      this.hierarchy.tx(tx)
      htx()
    }

    // 3. process all other transaction handlers
    await Promise.all(this.txh.map(async (t) => await measureAsync(t.name, async () => await t.tx(clientId, tx))))
    return result
  }
}

// This need this export to not hang on jest tests
/**
 * @public
 */
export { shutdown } from '@anticrm/mongo'
