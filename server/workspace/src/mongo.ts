import { Doc, Domain } from '@anticrm/core'
import { MongoClient, MongoClientOptions, Db, FilterQuery } from 'mongodb'

const connections = new Map<string, Promise<MongoClient>>()
const workspaceConnection = new Map<string, Promise<MongoClient>>()

// Register mongo close on process exit.
process.on('exit', () => {
  shutdown().catch((err) => console.error(err))
})

export async function shutdown (): Promise<void> {
  for (const c of connections.values()) {
    await (await c).close()
  }
  connections.clear()
  workspaceConnection.clear()
}
/**
 * Initialize a workspace connection to DB
 */
export async function initMongoConnection (workspaceId: string, uri: string, options?: MongoClientOptions): Promise<Db> {
  let client = connections.get(uri)
  if (client === undefined) {
    client = MongoClient.connect(uri, { ...options, useUnifiedTopology: true })
    await client
    connections.set(uri, client)
  }
  workspaceConnection.set(workspaceId, client)
  return (await client).db(workspaceDb(workspaceId))
}
async function getClient (workspaceId: string): Promise<MongoClient> {
  const client = workspaceConnection.get(workspaceId)
  if (client === undefined) {
    throw new Error('mongodb connection is not initialized')
  }
  return await client
}

/**
 * Drop domain documents from databse
 * @param domain - domain to be cleaned.
 */
export async function dropDomain (workspaceId: string, domain: Domain, query: FilterQuery<Doc>): Promise<void> {
  const dbId = workspaceDb(workspaceId)
  const db = (await getClient(workspaceId)).db(dbId)
  await db.collection(domain as string).deleteMany(query)
}

/**
 * Dump all documents from domain.
 */
export async function dumpDomain (workspaceId: string, domain: Domain): Promise<Doc[]> {
  const dbId = workspaceDb(workspaceId)
  const collection = (await getClient(workspaceId)).db(dbId).collection(domain as string)
  return await (await collection.find({})).toArray()
}

/**
 * Drop a full database for workspace
 */
export async function dropWorkspace (workspaceId: string): Promise<void> {
  const dbId = workspaceDb(workspaceId)
  const db = (await getClient(workspaceId)).db(dbId)
  await db.dropDatabase()
}

export function workspaceDb (workspaceId: string): string {
  return 'ws-' + workspaceId
}
