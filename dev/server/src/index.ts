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

import regCalendarActions from '@anticrm/calendar-action'
import regCalendarMappers from '@anticrm/calendar-mappers'
import core, { printMeasurements } from '@anticrm/core'
import builder from '@anticrm/model-all'
import { shutdown } from '@anticrm/mongo'
import regNotificationMappers from '@anticrm/notification-mappers'
import regRecruitingActions from '@anticrm/recruiting-action'
import regRecruitingMappers from '@anticrm/recruiting-mappers'
import { assignWorkspace, ClientInfo, SecurityOptions, startServer } from '@anticrm/server'
import { upgradeWorkspace } from '@anticrm/workspaces'
import { readFileSync } from 'fs'
import { startAuthServer } from './auth'
import { startFileServer } from './file'
import { startInfoServer } from './info'
import { AccountDetails } from '../../../server/server/lib/token'

const dbUri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017'
const LOG_TR = Boolean(process.env.LOG_TRANSACTIONS)
const LOG_R = Boolean(process.env.LOG_REQUESTS)

const john = 'john.appleseed@gmail.com'
const brian = 'brian.appleseed@gmail.com'

const details: Record<string, AccountDetails> = {
  [john]: {
    email: john,
    firstName: 'John',
    lastName: 'Appleseed'
  },
  [brian]: {
    email: brian,
    firstName: 'Brian',
    lastName: 'Appleseed'
  }
}

const defaultPass = '123'

const defaultWorkspace = 'workspace'
const defaultWorkspaceOrg = 'Horses inc'

async function start (): Promise<void> {
  await regCalendarMappers()
  await regRecruitingMappers()
  await regNotificationMappers()
  await regCalendarActions()
  await regRecruitingActions()

  await upgradeWorkspace(defaultWorkspace, { mongoDBUri: dbUri, txes: builder.getTxes() })

  const security: SecurityOptions = {
    key: readFileSync('../certificates/cert.key').toString(),
    cert: readFileSync('../certificates/cert.crt').toString(),
    ca: readFileSync('../certificates/RootCA.crt').toString()
  }

  const s = await startServer('localhost', 18080, 'secret', { logRequests: LOG_R, logTransactions: LOG_TR, security })
  const fileServer = startFileServer(18082, 'secret', security)

  const { accounts, shutdown: authShutdown } = await startAuthServer(3000, dbUri, 'secret', security)

  const { shutdown: infoShutdown } = await startInfoServer(3001, security)

  const cl = setInterval(printMeasurements, 10000)
  const close = (): void => {
    clearInterval(cl)
    fileServer.shutdown()
    s.shutdown()
    void authShutdown()
    void infoShutdown()
    fileServer.shutdown()
    void shutdown().then(() => process.exit(0))
  }
  process.on('SIGINT', close)
  process.on('SIGTERM', close)
  process.on('exit', close)

  // Create a demo account and workspace if it is missing.

  for (const account of [john, brian]) {
    if ((await accounts.findAccount(account)) === undefined) {
      console.log('Create account with ', details)
      await accounts.createAccount(account, defaultPass, details[account])
    }
  }

  let workspaceId = (await accounts.findWorkspace(defaultWorkspace))?._id.toString()
  if (workspaceId === undefined) {
    workspaceId = (await accounts.createWorkspace(defaultWorkspace, defaultWorkspaceOrg)).toString()
  }

  for (const account of [john, brian]) {
    const accountInfo = await accounts.findAccount(account)
    if (accountInfo !== undefined) {
      if (!accountInfo.workspaces.includes(workspaceId)) {
        try {
          await accounts.addWorkspace(account, defaultWorkspace)
        } catch (ee: any) {
          console.log(ee, accountInfo, workspaceId)
        }
      }
    }
  }
  console.log('Serve and Auth server are up and running')

  const systemInfo: ClientInfo = {
    accountId: core.account.System,
    clientId: 'system',
    workspaceId: defaultWorkspace,
    tx: () => {}
  }
  await assignWorkspace(systemInfo)
}
console.log('Starting Server + Auth Server')
start().catch((err) => console.log(err))
