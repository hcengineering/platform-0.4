<!--
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
-->
<script lang="ts">
  import { Data, generateId } from '@anticrm/core'
  import core from '@anticrm/core'
  import { fsmPlugin } from '@anticrm/fsm-impl'
  import { getPlugin } from '@anticrm/platform'
  import type { Vacancy, VacancySpace } from '@anticrm/recruiting'
  import recruiting from '@anticrm/recruiting'
  import { Dialog } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'

  import VacancyEditor from './VacancyEditor.svelte'

  const client = getClient()

  const vacancyID = generateId<Vacancy>()
  let space: VacancySpace = {
    name: '',
    description: '',
    fsm: '' as VacancySpace['fsm'],
    vacancy: vacancyID,
    private: true,
    members: [client.accountId()]
  } as VacancySpace
  let vacancy: Vacancy & Data<Required<Vacancy>> = {
    details: {
      summary: '',
      qualification: '',
      experience: ''
    },
    company: '',
    location: '',
    type: '',
    dueDate: new Date().getTime()
  } as Vacancy & Data<Required<Vacancy>>

  async function createVacancy () {
    if (!space.fsm) {
      return
    }

    const fsmP = await getPlugin(fsmPlugin.id)
    const dFSM = await fsmP.duplicateFSM(space.fsm)

    if (!dFSM) {
      return
    }

    const sDoc = await client.createDoc(recruiting.class.VacancySpace, core.space.Model, {
      ...space,
      fsm: dFSM._id
    })

    client.createDoc(recruiting.class.Vacancy, sDoc._id, vacancy, vacancyID)
  }
</script>

<Dialog label={recruiting.string.AddVacancy} okLabel={recruiting.string.AddVacancy} okAction={createVacancy} on:close>
  <VacancyEditor bind:vacancy bind:space />
</Dialog>
