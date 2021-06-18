import core, {
  allowDomain,
  combine,
  disallowDomain,
  DOMAIN_MODEL,
  DOMAIN_TX,
  Hierarchy,
  Storage,
  Tx
} from '@anticrm/core'
import { MongoConnection } from '@anticrm/mongo-storage'
import { newSecurityModel, SecurityClientStorage, SecurityModel } from './security'
import { ClientInfo, Workspace } from './workspace'

const workspaces = new Map<string, Workspace>()
const clients = new Map<string, ClientInfo>()

const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017'

async function createWorkspace (workspaceId: string): Promise<Workspace> {
  const mongoFactory = new MongoConnection(MONGO_URI)

  const hierarchy = new Hierarchy()

  const txStorage = await mongoFactory.createMongoTxStorage(workspaceId, hierarchy)
  const mongoDocStorage = await mongoFactory.createMongoDocStorage(workspaceId, hierarchy)

  // Build a hierarchy based on current set of transactions.
  const txes = await txStorage.findAll<Tx>(core.class.Tx, {})
  for (const tx of txes) {
    await hierarchy.tx(tx) // we could cast since we sure all documents are Tx based.
  }

  const store: Storage = combine(
    allowDomain(hierarchy, txStorage, DOMAIN_TX),
    disallowDomain(hierarchy, mongoDocStorage, DOMAIN_MODEL, DOMAIN_TX)
  )

  // TODO: Replace with a real security implementation.
  const security: SecurityModel = newSecurityModel()

  return new Workspace(
    hierarchy,
    store,
    [
      { tx: async (tx) => hierarchy.tx(tx) }, // Update hierarchy
      store, // Update tx and doc storage
      security // Update security
    ],
    async () => {
      await mongoFactory.shutdown()
    },
    security
  )
}

/**
 * Return or construct workspace instance.
 * @param client
 */
async function getCreateWorkspace (client: ClientInfo): Promise<Workspace> {
  const ws = workspaces.get(client.workspaceId) ?? (await createWorkspace(client.workspaceId))
  workspaces.set(client.workspaceId, ws)

  ws.clients.set(client.clientId, client)
  clients.set(client.clientId, client)
  return ws
}

/**
 * Assign client to workspace, construct workspace if it is not yet started.
 * @param client
 */
export async function assignWorkspace (client: ClientInfo): Promise<Storage> {
  // Create a client storage associated with workspace
  const ws = await getCreateWorkspace(client)

  return new SecurityClientStorage(ws, client)
}

export async function closeWorkspace (clientId: string): Promise<void> {
  const info = clients.get(clientId)
  clients.delete(clientId)
  if (info === undefined) {
    return
  }
  const ws = workspaces.get(info.workspaceId)
  if (ws !== undefined) {
    ws.clients.delete(clientId)
    if (ws.clients.size === 0) {
      workspaces.delete(info.workspaceId)
      // In case we do not have active clients, let's shutdown workspaces.
      await ws.shutdown()
    }
  }
}
