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
  import core, { Data } from '@anticrm/core'
  import fsm from '@anticrm/fsm'
  import type { VacancySpace } from '@anticrm/recruiting'
  import recruiting from '@anticrm/recruiting'
  import { Card, Grid, EditBox } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'

  const client = getClient()
  const dispatch = createEventDispatcher()

  const vacancy: Data<VacancySpace> = {
    name: '',
    description: '',
    private: true,
    members: [client.accountId()],
    company: '',
    location: ''
  }

  async function createVacancy () {
    const space = await client.createDoc(recruiting.class.VacancySpace, core.space.Model, vacancy)
    await client.createDoc(fsm.class.FSM, space._id, {
      name: '',
      clazz: recruiting.class.VacancySpace,
      isTemplate: false
    })
  }

  let canSave = false
  $: canSave = vacancy.name !== ''
</script>

<Card label={recruiting.string.AddVacancy} {canSave} okAction={createVacancy} on:close={() => dispatch('close')}>
  <Grid column={1} rowGap={24}>
    <EditBox label={recruiting.string.VacancyTitle} bind:value={vacancy.name} focus />
    <EditBox label={recruiting.string.Company} bind:value={vacancy.company} />
  </Grid>
</Card>
