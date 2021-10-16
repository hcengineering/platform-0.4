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
import core, {
  Class,
  Data,
  Doc,
  getMeasurements,
  measureAsync,
  newTxCreateDoc,
  Ref,
  Space,
  TxProcessor
} from '@anticrm/core'
import { Account } from '@anticrm/core/src/classes'
import builder from '@anticrm/model-all'
import { demoAccount, DemoBuilder, demoChunter, demoTask } from '@anticrm/model-dev'
import regNotificationMappers from '@anticrm/notification-mappers'
import regRecruitingActions from '@anticrm/recruiting-action'
import regRecruitingMappers from '@anticrm/recruiting-mappers'
import { assignWorkspace } from '@anticrm/server'
import { createWorkspace, deleteWorkspace } from '@anticrm/workspaces'

const dbUri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017'

const defaultWorkspace = 'workspace'

async function start (): Promise<void> {
  await regCalendarMappers()
  await regRecruitingMappers()
  await regNotificationMappers()
  await regCalendarActions()
  await regRecruitingActions()

  console.info('Wiping all model and generate a huge set')
  await deleteWorkspace(defaultWorkspace, { mongoDBUri: dbUri, txes: [] })
  await createWorkspace(defaultWorkspace, { mongoDBUri: dbUri, txes: builder.getTxes() })

  const { workspace } = await assignWorkspace({
    clientId: 'c0',
    accountId: core.account.System,
    workspaceId: defaultWorkspace,
    tx: () => {}
  })

  const db: DemoBuilder = {
    createDoc: async <T extends Doc>(
      _class: Ref<Class<T>>,
      attributes: Data<T>,
      objectId: Ref<T>, // ObjectID should be not uniq for model instance values, for upgrade procedure to work properly.
      docOptions?: Partial<Doc>
    ): Promise<T> => {
      const docTx = newTxCreateDoc('c0' as Ref<Account>, _class, docOptions?.space as Ref<Space>, attributes, objectId)

      await measureAsync('tx.time', async () => {
        await workspace.workspace.tx('c0', docTx)
      })

      return TxProcessor.createDoc2Doc(docTx) as T
    }
  }

  function toLen (val: string, len = 50): string {
    while (val.length < len) {
      val += ' '
    }
    return val
  }

  const printInfo = (): void => {
    const val = getMeasurements()
      .filter((m) => m.total > 1)
      .map((m) => `${toLen(m.name)}: avg ${m.avg} total: ${m.total} ops: ${m.ops}`.trim())
      .join('\n')
    console.log('\nStatistics:\n', val)
  }
  setInterval(printInfo, 5000)

  const d1 = Date.now()
  console.info('Generate accounts')
  await demoAccount(db, 1000)
  const d2 = Date.now()
  console.info('Done in', d2 - d1)

  console.info('Generate tasks')
  const tasks = await demoTask(db, 10000)
  const d3 = Date.now()
  console.info('Done in', d3 - d2)

  console.info('Generate messages')
  await demoChunter(db, tasks, 100, 10000)
  const d4 = Date.now()
  console.info('Done in', d4 - d3)

  await workspace.waitDDComplete()
  printInfo()
  process.exit(0)
}
console.log('Starting Default workspace data generation...')
start().catch((err) => console.log(err))
