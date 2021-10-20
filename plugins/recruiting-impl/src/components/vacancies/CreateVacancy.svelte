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
  import { createEventDispatcher } from 'svelte'
  import core from '@anticrm/core'
  import { fsmPlugin } from '@anticrm/fsm-impl'
  import { getPlugin } from '@anticrm/platform'
  import type { VacancySpace } from '@anticrm/recruiting'
  import recruiting from '@anticrm/recruiting'
  import { Card, Grid } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'

  import VacancyEditor from './VacancyEditor.svelte'

  const client = getClient()
  const dispatch = createEventDispatcher()

  let vacancy: VacancySpace = {
    name: '',
    description: '',
    fsm: '' as VacancySpace['fsm'],
    private: true,
    members: [client.accountId()],
    details: {
      summary: '',
      qualification: '',
      experience: ''
    },
    company: '',
    location: '',
    type: '',
    dueDate: undefined
  } as VacancySpace

  async function createVacancy () {
    if (!vacancy.fsm) {
      return
    }

    const fsmP = await getPlugin(fsmPlugin.id)
    const dFSM = await fsmP.duplicateFSM(vacancy.fsm)

    if (!dFSM) {
      return
    }

    await client.createDoc(recruiting.class.VacancySpace, core.space.Model, {
      ...vacancy,
      fsm: dFSM._id
    })
  }
</script>

<!-- <Dialog label={recruiting.string.AddVacancy} okLabel={recruiting.string.AddVacancy} okAction={createVacancy} on:close>
  <VacancyEditor bind:vacancy />
</Dialog> -->

<Card label={recruiting.string.AddVacancy} canSave={true} okAction={createVacancy} on:close={() => dispatch('close')}>
  <Grid column={1} rowGap={24}>
    <VacancyEditor bind:vacancy />
  </Grid>
</Card>
