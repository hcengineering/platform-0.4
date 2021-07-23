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

import { Storage, Tx } from '@anticrm/core'
import { Server, start } from './server'
import { decodeToken } from './token'
import { assignWorkspace, closeWorkspace } from './workspaces'

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
function connectClient (serverToken: string): (clientId: string, token: string, sendTx: (tx: Tx) => void, close: () => void) => Promise<Storage> {
  return async (clientId, token, sendTx) => {
    try {
      const { accountId, workspaceId } = decodeToken(serverToken, token)
      console.log(`Connected Client ${clientId} with account: ${accountId} to ${workspaceId} `)
      return await assignWorkspace({ clientId, accountId, workspaceId, tx: sendTx })
    } catch (err) {
      throw new Error('invalid token')
    }
  }
}

