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

import core, { Client, Ref, TxOperations } from '@anticrm/core'
import { FSM } from '@anticrm/fsm'
import recrutting, { VacancySpace } from '@anticrm/recruiting'
import { TrelloBoard } from './trello'

export async function createVacancySpace (
  fsmId: Ref<FSM>,
  client: Client & TxOperations,
  board: TrelloBoard
): Promise<Ref<VacancySpace>> {
  const vacancyId = ('vacancy' + fsmId) as Ref<VacancySpace>
  const vacancySpace = await client.findAll(recrutting.class.VacancySpace, { _id: vacancyId, fsm: fsmId })
  const clientId = await client.accountId()
  if (vacancySpace.length === 0) {
    await client.createDoc(
      recrutting.class.VacancySpace,
      core.space.Model,
      {
        fsm: fsmId,
        name: board.name,
        description: '',
        private: false,
        members: [clientId],
        company: '',
        location: '',
        type: '',
        details: {
          summary: '',
          qualification: '',
          experience: ''
        }
      },
      vacancyId
    )
  } else {
    if (!Array.from(vacancySpace[0].members).includes(clientId)) {
      await client.updateDoc(vacancySpace[0]._class, vacancySpace[0].space, vacancyId, {
        $push: { members: clientId }
      })
    }
  }
  return vacancyId
}
