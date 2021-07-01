import { Storage } from '@anticrm/core'
import { Workspace } from '@anticrm/workspace'
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
  const workspace = await Workspace.create(workspaceId, { mongoDBUri: MONGO_URI }, (hierarchy, storage, model) => {
    security = new SecurityModel(hierarchy)
    return [
      security
      // <<---- Placeholder: Add triggers here
      // hierarchy and storage are available
    ]
  })

  return {
    workspace,
    security,
    clients: new Map<string, ClientInfo>()
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
export async function assignWorkspace (client: ClientInfo): Promise<Storage> {
  // Create a client storage associated with workspace
  const ws = await getCreateWorkspace(client)
  return new SecurityClientStorage(ws.security, ws.workspace, ws.workspace.getHierarchy(), client, ws.clients)
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
