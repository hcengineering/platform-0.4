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

import { start } from './server'
import { decodeToken } from './token'
import { assignWorkspace, closeWorkspace } from './workspaces'

const SERVER_SECRET = process.env.SERVER_SECRET ?? 'secret'
const SERVER_HOST = process.env.SERVER_HOST ?? 'localhost'
const SERVER_PORT = parseInt(process.env.SERVER_PORT ?? '18080')

// eslint-disable-next-line
start(SERVER_HOST, SERVER_PORT, {
  connect: async (clientId, token, sendTx, close) => {
    try {
      const { accountId, workspaceId } = decodeToken(SERVER_SECRET, token)
      console.log(`Connected Client ${clientId} with account: ${accountId} to ${workspaceId} `)
      return await assignWorkspace({ clientId, accountId, workspaceId, tx: sendTx })
    } catch (err) {
      throw new Error('invalid token')
    }
  },
  close: async (clientId) => {
    await closeWorkspace(clientId)
  }
}).then((s) => {
  console.log('server is active at:', s.address())
})
