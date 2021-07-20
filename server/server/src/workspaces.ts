import { WithAccountId, DerivedDataProcessor, Storage, Tx } from '@anticrm/core'
import { TxHandler, Workspace } from '@anticrm/workspace'
import { ClientInfo, SecurityClientStorage, SecurityModel } from './security'

interface WorkspaceInfo {
  workspace: Workspace
  clients: Map<string, ClientInfo>
  security: SecurityModel
}

const workspaces = new Map<string, WorkspaceInfo>()
const clients = new Map<string, ClientInfo>()

const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017'

async function createWorkspace (workspaceId: string): Promise<WorkspaceInfo> {
  let security!: SecurityModel
  const clients = new Map<string, ClientInfo>()

  // Send transactions to clients.
  const sendTo: TxHandler = {
    async tx (tx: Tx): Promise<void> {
      sendToClients(clients, tx, security)
    }
  }

  const workspace = await Workspace.create(
    workspaceId,
    { mongoDBUri: MONGO_URI },
    async (hierarchy, storage, model) => {
      security = await SecurityModel.create(hierarchy, model)

      const derivedData = await DerivedDataProcessor.create(model, hierarchy, createDerivedDataStorage(storage, sendTo))
      return [
        sendTo, // Send to clients of passed tx
        security,
        derivedData // If dd produce more tx, they also will be send.
        // <<---- Placeholder: Add triggers here
        // hierarchy and storage are available
      ]
    }
  )

  return {
    workspace,
    security,
    clients
  }
}

function sendToClients (clients: Map<string, ClientInfo>, tx: Tx, security: SecurityModel): void {
  for (const cl of clients.entries()) {
    const differentAccount = cl[1].accountId !== tx.modifiedBy
    const spaceOpAllowed = security.checkSecurity(cl[1].accountId, tx)
    if (differentAccount && spaceOpAllowed) {
      cl[1].tx(tx)
    }
  }
}

function createDerivedDataStorage (storage: Storage, sendTo: TxHandler): Storage {
  // Send derived data produced objects to clients.
  return {
    findAll: async (_class, query) => await storage.findAll(_class, query),
    tx: async (tx) => {
      await storage.tx(tx)

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      sendTo.tx(tx)
    }
  }
}

/**
 * Return or construct workspace instance.
 * @param client
 */
async function getCreateWorkspace (client: ClientInfo): Promise<WorkspaceInfo> {
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
export async function assignWorkspace (client: ClientInfo): Promise<WithAccountId> {
  // Create a client storage associated with workspace
  const ws = await getCreateWorkspace(client)
  return new SecurityClientStorage(ws.security, ws.workspace, ws.workspace.getHierarchy(), client)
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
    }
  }
}
