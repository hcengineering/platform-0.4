import { Class, Doc, DocumentQuery, Ref, Storage, Tx } from '@anticrm/core'
import { ClientInfo, Workspace } from './workspace'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SecurityModel {
  tx: (tx: Tx) => Promise<void>
  checkSecurity: (accountId: string, tx: Tx) => Promise<boolean>
}

export class SecurityClientStorage implements Storage {
  constructor (readonly workspace: Workspace, readonly user: ClientInfo) {}

  async findAll<T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>): Promise<T[]> {
    // Filter for client accountId
    return await this.workspace.findAll(_class, query)
  }

  async tx (tx: Tx): Promise<void> {
    // Check if tx is allowed and process with workspace
    await this.workspace.tx(tx)

    // Check security and send to other clients.
    const security = this.workspace.getSecurity()
    for (const cl of this.workspace.clients.entries()) {
      if (cl[0] !== this.user.clientId && (await security.checkSecurity(cl[1].accountId, tx))) {
        cl[1].tx(tx)
      }
    }
  }
}

export function newSecurityModel (): SecurityModel {
  return {
    tx: async (tx) => {}, // TODO: Handle transactions to update model here
    checkSecurity: async (accountId, tx) => true // TODO: Return a proper values here.
  }
}
