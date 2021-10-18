import core, { DerivedDataProcessor, Storage, Tx, CoreClient, Hierarchy, isDerivedDataTx } from '@anticrm/core'
import { TxHandler, Workspace } from '@anticrm/workspace'
import { ActionRuntime } from './actions/runtime'
import { ClientInfo, SecurityClientStorage, SecurityModel } from './security'

/**
 * @public
 */
export interface WorkspaceInfo {
  workspace: Workspace
  clients: Map<string, ClientInfo>
  security: SecurityModel
  waitDDComplete: () => Promise<void>
  close: () => Promise<void>
}

const workspaces = new Map<string, WorkspaceInfo>()
const clients = new Map<string, ClientInfo>()

const MONGO_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017'

async function createWorkspace (workspaceId: string): Promise<WorkspaceInfo> {
  let security!: SecurityModel
  const clients = new Map<string, ClientInfo>()

  // Send transactions to clients.
  let resActionRuntime: (x: ActionRuntime) => void
  const actionRuntimeP: Promise<ActionRuntime> = new Promise((resolve) => {
    resActionRuntime = resolve
  })

  let waitDDComplete: () => Promise<void> = async () => await Promise.resolve()
  let closeDD: () => Promise<void> = async () => await Promise.resolve()

  const workspace: Workspace = await Workspace.create(
    workspaceId,
    {
      mongoDBUri: MONGO_URI
    },
    async (hierarchy, storage, model) => {
      const sendTo: TxHandler = {
        name: 'send.to',
        async tx (clientId: string, tx: Tx): Promise<void> {
          sendToClients(clientId, clients, tx, security, hierarchy)
        }
      }

      security = await SecurityModel.create(hierarchy, model)
      const actionRuntime = new ActionRuntime(hierarchy, model, storage)

      resActionRuntime(actionRuntime)

      const ddSendStorage = createDerivedDataStorage(storage, sendTo)
      const derivedData = await DerivedDataProcessor.create(model, hierarchy, ddSendStorage)

      waitDDComplete = async () => await derivedData.waitComplete()
      closeDD = async () => await derivedData.close()
      const ddRuntime: TxHandler = {
        name: 'derived.data',
        tx: async (clientId, tx) => {
          // We do not need to wait for DD.
          void derivedData.tx(tx)
        }
      } // If dd produce more tx, they also will be send.

      const securityRuntime: TxHandler = { name: 'security', tx: async (clientId, tx) => await security.tx(tx) }

      return [
        sendTo, // Send to clients of passed tx
        securityRuntime,
        ddRuntime,
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
    clients,
    waitDDComplete,
    close: async () => {
      await closeDD()
    }
  }
}

function sendToClients (
  clientId: string,
  clients: Map<string, ClientInfo>,
  tx: Tx,
  security: SecurityModel,
  hierarchy: Hierarchy
): void {
  for (const cl of clients.entries()) {
    const differentAccount = cl[1].clientId !== clientId
    if (differentAccount && security.checkSecurity(cl[1].accountId, tx)) {
      // Only send if account is same, or space is allowed and space is not personalized.
      if (cl[1].accountId === tx.modifiedBy || tx.space === core.space.Tx || isDerivedDataTx(tx, hierarchy)) {
        cl[1].tx(tx)
      }
    }
  }
}

function createDerivedDataStorage (storage: Storage, sendTo: TxHandler): Storage {
  // Send derived data produced objects to clients.
  return {
    findAll: async (_class, query, options) => await storage.findAll(_class, query, options),
    tx: async (tx) => {
      await storage.tx(tx)
      void sendTo.tx('-', tx)
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
 * @public
 * @param client - ClientInfo
 */
export async function assignWorkspace (
  client: ClientInfo
): Promise<{ clientStorage: CoreClient, workspace: WorkspaceInfo }> {
  // Create a client storage associated with workspace
  const ws = await getCreateWorkspace(client)
  return {
    clientStorage: new SecurityClientStorage(ws.security, ws.workspace, ws.workspace.getHierarchy(), client),
    workspace: ws
  }
}

/**
 * @public
 */
export async function closeWorkspace (clientId: string): Promise<void> {
  const info = clients.get(clientId)
  clients.delete(clientId)
  if (info === undefined) {
    return
  }
  const ws = workspaces.get(info.workspaceId)
  if (ws !== undefined) {
    await ws.close()
    ws.clients.delete(clientId)
  }
}
