import core, { DOMAIN_TX, generateModelDiff } from '@anticrm/core'
import builder from '@anticrm/model-all'
import { getMongoClient, mongoEscape } from '@anticrm/mongo'

/**
 * Workspace connection options.
 * @public
 */
export interface WorkspaceOptions {
  mongoDBUri: string // Mongo DB URI.
  mongoOptions?: any // Any other mongo options, should be compatible with @{link MongoClientOptions}
}

/**
 * Create workspace and put all model transactions inside it.
 * @public
 */
export async function createWorkspace (workspaceId: string, options: WorkspaceOptions): Promise<void> {
  const client = await getMongoClient(options.mongoDBUri, options.mongoOptions)

  const db = client.db('ws-' + workspaceId)
  const collections = await db.collections()
  if (collections.length > 0) {
    throw Error('workspace already exists')
  }
  const txes = db.collection(DOMAIN_TX as string)
  for (const tx of builder.getTxes()) {
    await txes.insertOne(mongoEscape(tx))
  }
}

/**
 * Upgrade workspace and put all model transactions into it.
 * @public
 */
export async function upgradeWorkspace (workspaceId: string, options: WorkspaceOptions): Promise<void> {
  const client = await getMongoClient(options.mongoDBUri, options.mongoOptions)

  const db = client.db('ws-' + workspaceId)
  const txes = db.collection(DOMAIN_TX as string)

  // Find all system transactions.
  const existingTxes = await txes.find({ objectSpace: core.space.Model, modifiedBy: core.account.System }).toArray()

  const updateTxes = await generateModelDiff(existingTxes, builder.getTxes())

  for (const tx of updateTxes) {
    await txes.insertOne(mongoEscape(tx))
  }
}

/**
 * Completely remove workspace from DB.
 * @public
 */
export async function deleteWorkspace (workspaceId: string, options: WorkspaceOptions): Promise<void> {
  const client = await getMongoClient(options.mongoDBUri, options.mongoOptions)

  const db = client.db('ws-' + workspaceId)
  await db.dropDatabase().catch((err) => console.error(err))
}

// This need this export to not hang on jest tests
// @public
export { shutdown } from '@anticrm/mongo'
