import core, { WithAccountId, DerivedDataProcessor, Storage, Tx } from '@anticrm/core'
import { TxHandler, Workspace } from '@anticrm/workspace'
import { ActionRuntime } from './actions/runtime'
import { ClientInfo, SecurityClientStorage, SecurityModel } from './security'

export interface WorkspaceInfo {
  workspace: Workspace
  clients: Map<string, ClientInfo>
  security: SecurityModel
}

const workspaces = new Map<string, WorkspaceInfo>()
const clients = new Map<string, ClientInfo>()

const MONGO_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017'

async function createWorkspace (workspaceId: string): Promise<WorkspaceInfo> {
  let security!: SecurityModel
  const clients = new Map<string, ClientInfo>()

  // Send transactions to clients.
  const sendTo: TxHandler = {
    async tx (clientId: string, tx: Tx): Promise<void> {
      sendToClients(clientId, clients, tx, security)
    }
  }

  let resActionRuntime: (x: ActionRuntime) => void
  const actionRuntimeP: Promise<ActionRuntime> = new Promise((resolve) => {
    resActionRuntime = resolve
  })

  const workspace: Workspace = await Workspace.create(
    workspaceId,
    { mongoDBUri: MONGO_URI },
    async (hierarchy, storage, model) => {
      security = await SecurityModel.create(hierarchy, model)
      const actionRuntime = new ActionRuntime(hierarchy, model, storage)

      resActionRuntime(actionRuntime)

      const derivedData = await DerivedDataProcessor.create(model, hierarchy, storage, true)
      return [
        sendTo, // Send to clients of passed tx
        { tx: async (clientId, tx) => await security.tx(tx) },
        {
          tx: async (clientId, tx) => {
            const processor = derivedData.clone(createDerivedDataStorage(clientId, storage, sendTo))
            return await processor.tx(tx)
          }
        }, // If dd produce more tx, they also will be send.
        actionRuntime
        // <<---- Placeholder: Add triggers here
        // hierarchy and storage are available
      ]
    }
  )

  await actionRuntimeP.then(async (runtime) => await runtime.init(workspace.tx.bind(workspace)))

  return {
    workspace,
    security,
    clients
  }
}

function sendToClients (clientId: string, clients: Map<string, ClientInfo>, tx: Tx, security: SecurityModel): void {
  for (const cl of clients.entries()) {
    const differentAccount = cl[1].clientId !== clientId
    const spaceOpAllowed = security.checkSecurity(cl[1].accountId, tx)
    if (differentAccount && spaceOpAllowed) {
      // Only send if account is same, or space is allowed and space is not personalized.
      if (cl[1].accountId === tx.modifiedBy || tx.space === core.space.Tx) {
        cl[1].tx(tx)
      }
    }
  }
}

function createDerivedDataStorage (clientId: string, storage: Storage, sendTo: TxHandler): Storage {
  // Send derived data produced objects to clients.
  return {
    findAll: async (_class, query) => await storage.findAll(_class, query),
    tx: async (tx) => {
      await storage.tx(tx)

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      sendTo.tx(clientId, tx)
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
export async function assignWorkspace (
  client: ClientInfo
): Promise<{ clientStorage: WithAccountId, workspace: WorkspaceInfo }> {
  // Create a client storage associated with workspace
  const ws = await getCreateWorkspace(client)
  return {
    clientStorage: new SecurityClientStorage(ws.security, ws.workspace, ws.workspace.getHierarchy(), client),
    workspace: ws
  }
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
  }
}
