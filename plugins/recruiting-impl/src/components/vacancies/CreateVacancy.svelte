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
  import core, { Ref } from '@anticrm/core'
  import type { QueryUpdater } from '@anticrm/presentation'
  import type { FSM } from '@anticrm/fsm'
  import { fsmPlugin } from '@anticrm/fsm-impl'
  import { getPlugin } from '@anticrm/platform'
  import type { VacancySpace } from '@anticrm/recruiting'
  import recruiting from '@anticrm/recruiting'
  import { Card, Grid, EditBox, Dropdown, DropdownItem } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'

  const client = getClient()
  const dispatch = createEventDispatcher()

  const vacancy: VacancySpace = {
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

  let selectedFSM: FSM | undefined = undefined
  $: selectedFSM = fsmTmpls.find((x) => x._id === selectedFSMId)

  let fsmTmpls: FSM[] = []
  let lq: QueryUpdater<FSM> | undefined

  if (vacancy._id === undefined) {
    lq = client.query(lq, fsmPlugin.class.FSM, { clazz: recruiting.class.VacancySpace, isTemplate: true }, (result) => {
      fsmTmpls = result
      if (selectedFSM === undefined) {
        selectedFSM = result[0]
      }
    })
  }

  function onChange () {
    dispatch('update')
  }

  let fsmItems: DropdownItem[] = []
  $: fsmItems = fsmTmpls.map((x) => ({
    id: x._id,
    label: x.name
  }))
  let selectedFSMId: string | undefined

  $: if (vacancy._id === undefined) {
    vacancy.fsm = selectedFSMId as Ref<FSM>
    onChange()
  }

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

  let canSave = false
  $: canSave = vacancy.name !== '' && vacancy.fsm !== ''
</script>

<Card label={recruiting.string.AddVacancy} {canSave} okAction={createVacancy} on:close={() => dispatch('close')}>
  <Grid column={1} rowGap={24}>
    <EditBox label={recruiting.string.VacancyTitle} bind:value={vacancy.name} on:blur={onChange} focus />
    <EditBox label={recruiting.string.Company} bind:value={vacancy.company} on:blur={onChange} />
  </Grid>
  <svelte:fragment slot="pool">
    <Dropdown items={fsmItems} bind:selected={selectedFSMId} label={recruiting.string.Flow} />
  </svelte:fragment>
</Card>
