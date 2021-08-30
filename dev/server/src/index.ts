//
// Copyright © 2020 Anticrm Platform Contributors.
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

import { getMongoClient } from '@anticrm/mongo'
import { startServer } from '@anticrm/server'
import { upgradeWorkspace } from '@anticrm/workspaces'
import { newAuthServer } from './auth'

const dbUri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017'

const john = 'john.appleseed@gmail.com'
const brian = 'brian.appleseed@gmail.com'
const defaultPass = '123'

const defaultWorkspace = 'workspace'
const defaultWorkspaceOrg = 'Horses inc'

async function start (): Promise<void> {
  const client = await getMongoClient(dbUri)

  const db = client.db('accounts')

  await upgradeWorkspace(defaultWorkspace, { mongoDBUri: dbUri })

  const s = await startServer('localhost', 18080, 'secret', { logRequests: true, logTransactions: true })

  const addr = s.address()
  const { accounts } = await newAuthServer(3000, db, { server: addr.address, port: addr.port, tokenSecret: 'secret' })

  // Create a demo account and workspace if it is missing.

  for (const account of [john, brian]) {
    if ((await accounts.findAccount(account)) === undefined) {
      await accounts.createAccount(account, defaultPass)
    }
  }

  if ((await accounts.findWorkspace(defaultWorkspace)) === undefined) {
    await accounts.createWorkspace(defaultWorkspace, defaultWorkspaceOrg)

    await accounts.addWorkspace(john, defaultWorkspace)
    await accounts.addWorkspace(brian, defaultWorkspace)
  }

  console.log('Serve and Auth server are up and running')
}
console.log('Starting Server + Auth Server')
start().catch((err) => console.log(err))
