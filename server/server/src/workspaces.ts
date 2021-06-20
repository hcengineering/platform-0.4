import core, {
  Class, Doc, DOMAIN_MODEL,
  DOMAIN_TX, Emb, Hierarchy, Obj, Ref, Storage,
  Tx,
  TxAddCollection,
  TxCreateDoc,
  TxUpdateCollection,
  TxUpdateDoc
} from '@anticrm/core'
import { MongoConnection } from '../../mongo/lib'
import { newSecurityModel, SecurityClientStorage, SecurityModel } from './security'
import { ClientInfo, Workspace } from './workspace'

const workspaces = new Map<string, Workspace>()
const clients = new Map<string, ClientInfo>()

const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017'

export class WorkspaceStorage implements Storage {
  constructor (readonly hierarchy: Hierarchy, readonly txStore: Storage, readonly doc: Storage) {
  }

  txObjectClass (tx: Tx<Doc>): Ref<Class<Obj>> {
    switch (tx._class) {
      case core.class.TxCreateDoc:
        return (tx as TxCreateDoc<Doc>).objectClass
      case core.class.TxUpdateDoc:
        return (tx as TxUpdateDoc<Doc>).objectClass
      case core.class.TxAddCollection:
        return (tx as TxAddCollection<Doc, Emb>).itemClass
      case core.class.TxUpdateCollection:
        return (tx as TxUpdateCollection<Doc, Emb>).itemClass
    }

    throw new Error(`Tx has no objectClass defined ${tx._class}`)
  }

  async findAll<T extends Doc>(_class: Ref<Class<T>>, query: Partial<T>): Promise<T[]> {
    const domain = this.hierarchy.getDomain(_class)
    switch (domain) {
      case DOMAIN_TX:
        return await this.txStore.findAll(_class, query)
      case DOMAIN_MODEL:
        return [] // Model is rebuild from  transactions, so no need to return anyting.
      default:
        return await this.doc.findAll(_class, query)
    }
  }

  async tx (tx: Tx): Promise<void> {
    await this.txStore.tx(tx) // In any case send into transaction storage.

    const domain = this.hierarchy.getDomain(this.txObjectClass(tx))
    switch (domain) {
      case DOMAIN_TX:
        return // No need since already performed.
      case DOMAIN_MODEL:
        return // Model is rebuild from  transactions, so no need to return anyting.
      default:
        return await this.doc.tx(tx)
    }
  }
}

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

  const store = new WorkspaceStorage(hierarchy, txStorage, mongoDocStorage)

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
