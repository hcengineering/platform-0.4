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

import { generateToken } from '@anticrm/server'
import { createWorkspace, shutdown, upgradeWorkspace } from '@anticrm/workspaces'
import { Accounts } from '@anticrm/accounts'
import { getMongoClient, shutdown as mongoShutdown } from '@anticrm/mongo'
import builder from '@anticrm/model-all'

if (process.argv.length < 2) {
  console.warn('please use server-cli with {command} {arg} ')
}
const cmd = process.argv[2]
const arg1 = process.argv[3]
const arg2 = process.argv[4]

const MONGO_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017'
const SECRET = process.env.SERVER_SECRET ?? 'secret'

process.on('exit', () => {
  shutdown() //eslint-disable-line
  mongoShutdown() //eslint-disable-line
})

async function main (): Promise<void> {
  const client = await getMongoClient(MONGO_URI)
  const db = client.db('accounts')
  const accounts = new Accounts(db, 'workspace', 'account', '')

  async function initAccounts (): Promise<void> {
    if ((await db.collections()).length === 0) {
      await accounts.initAccountDb()
    }
  }
  async function initWorkspace (): Promise<void> {
    if ((await accounts.findWorkspace(arg1)) === undefined) {
      await accounts.createWorkspace(arg1, arg2 ?? arg1)
      await createWorkspace(arg1, { mongoDBUri: MONGO_URI, txes: builder.getTxes() })
    }
  }
  try {
    switch (cmd) {
      case 'init': {
        await initAccounts()
        break
      }
      case 'init-workspace': {
        await initAccounts()
        await initWorkspace()
        break
      }
      case 'generate-token': {
        const token = generateToken(SECRET, arg1, arg2, {})
        console.log('TOKEN: ', token)
        break
      }
      case 'create-workspace': {
        console.log(`creating workspace ${arg1}`)
        await initWorkspace()
        break
      }
      case 'upgrade-workspace': {
        console.log(`upgrading workspace ${arg1} (with dropping all model transactions)`)
        await upgradeWorkspace(arg1, { mongoDBUri: MONGO_URI, txes: builder.getTxes() })
        break
      }
      default:
        console.error('Unknown command', process.argv)
    }
  } finally {
    await shutdown()
  }
}

main().catch((err) => {
  console.error(err)
})
