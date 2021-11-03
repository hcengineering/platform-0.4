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

import { getMeasurements, Ref, withOperations } from '@anticrm/core'
import { FSM } from '@anticrm/fsm'
import { createClient } from '@anticrm/node-client'
import recruiting, { Applicant, Candidate } from '@anticrm/recruiting'
import { config } from 'dotenv'
import { readFile } from 'fs/promises'
import { clearInterval } from 'timers'
import { createUpdateApplicant } from './applicant'
import { createCandidatePool, createUpdateCandidates, getName } from './candidates'
import { buildFSMItems, createFSM, FSMColumn, updateFSMStates } from './fsm'
import { TrelloBoard } from './trello'
import { createVacancySpace } from './vacancies'

config()

const serverUri = process.env.SERVER_URI ?? 'wss://localhost:18080'
const token = process.env.TOKEN ?? ''

function toLen (val: string, len = 50): string {
  while (val.length < len) {
    val += ' '
  }
  return val
}
let prevInfo = ''
function printInfo (): void {
  const val = getMeasurements()
    .filter((m) => m.total > 1)
    .map((m) => `${toLen(m.name)}: avg ${m.avg} total: ${m.total} ops: ${m.ops}`.trim())
    .join('\n')
  if (prevInfo !== val) {
    prevInfo = val
    console.log('\nStatistics:\n', val)
  }
}

async function start (): Promise<void> {
  console.log('Importing trello data into Platform...')

  if (process.argv.length < 2) {
    console.error('Please pass trello board.json file as a command line parameter')
    process.exit(1)
  }

  let inputFile = ''
  let onlyLog = false
  let limit = -1

  for (const opt of process.argv) {
    if (opt.endsWith('.json')) {
      inputFile = opt
    }
    if (opt === '--log') {
      onlyLog = true
    }
    if (opt.startsWith('--limit')) {
      limit = parseInt(opt.split('=')[1])
    }
  }

  const intervalHandle = setInterval(printInfo, 5000)

  const board = JSON.parse((await readFile(inputFile)).toString()) as TrelloBoard

  const fsm: FSMColumn[] = buildFSMItems(board)

  if (onlyLog) {
    console.log('Total columns:', board.lists.length)
    console.log('Total cards:', board.cards.length)
    console.log('Total Actions:', board.actions.length)
    console.log('Total Members:', board.members.length)

    let i = 0
    for (const l of fsm) {
      console.info(l.id, l.name, '\n')
      for (const itm of l.items) {
        console.info(`\t${itm.id} ${JSON.stringify(getName(itm.name))}`)
      }
      i++
      if (i === limit) {
        break
      }
    }

    process.exit(0)
  }

  console.info('Connecting to server')
  const client = await createClient(`${serverUri}/${token}`)

  const clientId = await client.accountId()
  console.log('Connected as ', clientId)

  const clientOps = withOperations(await client.accountId(), client)

  const fsmId = board.id as Ref<FSM>

  // Create appropriate FSM.
  await createFSM(client, fsmId, board, clientOps)

  // Create/update states
  await updateFSMStates(clientOps, fsmId, fsm)

  // Create candidate pool
  const candPoolId = await createCandidatePool(fsmId, clientOps, board)

  // Add missing candidates.
  const { candidates, candidateStates } = await createUpdateCandidates(clientOps, candPoolId, board)

  // Create an public vacancy space for FSM if not pressent.
  const vacancyId = await createVacancySpace(fsmId, clientOps, board)

  // Add missing Accounts.
  // const membersMap = await createUpdateAccounts(clientOps, board, [vacancyId, candPoolId])

  const applicants = await client.findAll(recruiting.class.Applicant, { space: vacancyId })
  const applicantsMap = new Map<Ref<Candidate>, Applicant>(applicants.map((a) => [a.item as Ref<Candidate>, a]))

  await createUpdateApplicant(candidates, applicantsMap, candidateStates, vacancyId, clientId, clientOps)

  clearInterval(intervalHandle)
  printInfo()
  process.exit(0)
}
start().catch((err) => console.log(err))
