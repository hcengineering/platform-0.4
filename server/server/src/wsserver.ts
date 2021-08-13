//
// Copyright © 2021 Anticrm Platform Contributors.
//
// Licensed under the Eclipse Public License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License. You may
// obtain a copy of the License at https://www.eclipse.org/legal/epl-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//
// See the License for the specific language governing permissions and
// limitations under the License.
//

import core, { Account, newTxCreateDoc, Ref, Storage, Tx } from '@anticrm/core'
import * as gravatar from 'gravatar'
import { Server, start } from './server'
import { AccountDetails, decodeToken } from './token'
import { assignWorkspace, closeWorkspace, WorkspaceInfo } from './workspaces'

/**
 * @public
 */
export async function startServer (host: string, port: number, serverToken: string): Promise<Server> {
  const instance = await start(host, port, {
    connect: connectClient(serverToken),
    close: async (clientId) => {
      await closeWorkspace(clientId)
    }
  })
  return instance
}
function connectClient (
  serverToken: string
): (clientId: string, token: string, sendTx: (tx: Tx) => void, close: () => void) => Promise<Storage> {
  return async (clientId, token, sendTx) => {
    try {
      const { accountId, workspaceId, details } = decodeToken(serverToken, token)
      console.log(`Connected Client ${clientId} with account: ${accountId} to ${workspaceId} `)

      // eslint-disable-next-line
      const { workspace, clientStorage } = await assignWorkspace({ clientId, accountId, workspaceId, tx: sendTx })

      // We need to check if there is Account exists and if not create it.
      await updateAccount(workspace, accountId, details)

      return clientStorage
    } catch (err) {
      console.log('FAILED to accept client:', err)
      throw new Error('invalid token')
    }
  }
}

/**
 * Will check and create Account for current log-in user if required.
 */
async function updateAccount (workspace: WorkspaceInfo, accountId: Ref<Account>, details: AccountDetails): Promise<void> {
  const accountRef = await workspace.workspace.model.findAll(core.class.Account, { _id: accountId })
  if (accountRef.length === 0) {
    // We need to create an account entry.
    await workspace.workspace.tx(
      newTxCreateDoc<Account>(accountId, core.class.Account, core.space.Model, {
        email: details.email,
        name: ((details?.firstName ?? '') + ' ' + (details?.lastName ?? '')).trim(),
        firstName: details?.firstName ?? '',
        lastName: details?.lastName ?? '',
        avatar: gravatar.url(details.email) // TODO: Use platform plugin mechanism for this
      }, accountId))
  }
}

