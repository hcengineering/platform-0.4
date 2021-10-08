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

import { Ref, withOperations } from '@anticrm/core'
import { FSM, State } from '@anticrm/fsm'
import { createClient } from '@anticrm/node-client'
import { config } from 'dotenv'
import { readFile } from 'fs/promises'
import { createCandidatePool, createUpdateCandidates } from './candidates'
import { buildFSMItems, createFSM, FSMItem, updateFSMStates } from './fsm'
import { TrelloBoard } from './trello'
import { createVacancySpace } from './vacancies'
import recruiting, { Applicant, Candidate } from '@anticrm/recruiting'
import { deepEqual } from 'fast-equals'

config()

const serverUri = process.env.SERVER_URI ?? 'wss://localhost:18080'
const token = process.env.TOKEN ?? ''

async function start (): Promise<void> {
  console.log('Importing trello data into Platform...')

  if (process.argv.length < 2) {
    console.error('Please pass trello board.json file as a command line parameter')
    process.exit(1)
  }

  const board = JSON.parse((await readFile(process.argv[process.argv.length - 1])).toString()) as TrelloBoard

  const fsm: FSMItem[] = buildFSMItems(board)

  console.log('Found trello cards', board.cards.length)

  // for (const l of fsm) {
  //   console.info(l.id, l.name, '\n', l.items.map(l => `\t${l.id} ${JSON.stringify(getName(l.name))}`).join('\n'))
  // }

  // if (fsm.length > 0) {
  //   process.exit(1)
  // }

  console.info('Connecting to server')
  const client = await createClient(`${serverUri}/${token}`)

  const clientId = await client.accountId()
  console.log('Connected as ', clientId)

  const operations = withOperations(await client.accountId(), client)

  const fsmId = board.id as Ref<FSM>

  // Create appropriate FSM.
  await createFSM(client, fsmId, board, operations)

  // Create/update states
  const states = await updateFSMStates(operations, fsmId, fsm)

  // Create candidate pool
  const candPoolId = await createCandidatePool(fsmId, operations, board)

  // Add missing candidates.
  const { candidates, candidateStates } = await createUpdateCandidates(operations, candPoolId, board)

  // Create an public vacancy space for FSM if not pressent.
  const vacancyId = await createVacancySpace(fsmId, operations, board)

  const applicants = await client.findAll(recruiting.class.Applicant, { space: vacancyId })
  const applicantsMap = new Map<Ref<Candidate>, Applicant>(applicants.map((a) => [a.item as Ref<Candidate>, a]))

  const newStates = new Map<Ref<State>, { applicant: Ref<Applicant>, pos: number }[]>()

  for (const c of candidates) {
    const aid = ('a' + c._id) as Ref<Applicant>
    let appl = applicantsMap.get(c._id)
    const candState = candidateStates.get(c._id) as { state: Ref<State>, pos: number }
    if (appl === undefined) {
      // No applicant defined
      appl = await operations.createDoc(
        recruiting.class.Applicant,
        vacancyId,
        {
          item: c._id,
          recruiter: clientId,
          fsm: vacancyId,
          clazz: c._class,
          state: candState.state,
          comments: []
        },
        aid
      )
    }
    const appls: { applicant: Ref<Applicant>, pos: number }[] = newStates.get(candState.state) ?? []
    appls.push({ applicant: appl?._id, pos: candState.pos })
    newStates.set(candState.state, appls)
  }

  // Now I need to update states to contain proper applicants.
  for (const st of states) {
    // st.items
    const newValue = (newStates.get(st._id) ?? []).sort((a, b) => b.pos - a.pos).map((v) => v.applicant)
    if (!deepEqual(st.items, newValue)) {
      await operations.updateDoc(st._class, st.space, st._id, { items: newValue })
    }
  }

  process.exit(0)
}
start().catch((err) => console.log(err))
