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
  import core, { Data, Ref } from '@anticrm/core'
  import type { QueryUpdater } from '@anticrm/presentation'
  import fsm from '@anticrm/fsm'
  import type { FSM } from '@anticrm/fsm'
  import { getPlugin } from '@anticrm/platform'
  import type { VacancySpace } from '@anticrm/recruiting'
  import recruiting from '@anticrm/recruiting'
  import { Card, Grid, EditBox, Dropdown } from '@anticrm/ui'
  import type { DropdownItem } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'

  const client = getClient()
  const dispatch = createEventDispatcher()

  const vacancy: Data<VacancySpace> = {
    name: '',
    description: '',
    fsm: '' as Ref<FSM>,
    private: true,
    members: [client.accountId()],
    company: '',
    location: ''
  }

  let fsmId: Ref<FSM> | undefined

  let fsmTmpls: FSM[] = []
  let lq: QueryUpdater<FSM> | undefined

  lq = client.query(lq, fsm.class.FSM, { clazz: recruiting.class.VacancySpace, isTemplate: true }, (result) => {
    fsmTmpls = result
    if (vacancy.fsm === undefined) {
      fsmId = result.shift()?._id
    }
  })

  let fsmItems: DropdownItem[] = []
  $: fsmItems = fsmTmpls.map((x) => ({
    id: x._id,
    label: x.name
  }))

  async function createVacancy () {
    if (fsmId === undefined) {
      return
    }

    const fsmP = await getPlugin(fsm.id)
    const dFSM = await fsmP.duplicateFSM(fsmId)

    if (!dFSM) {
      return
    }

    await client.createDoc(recruiting.class.VacancySpace, core.space.Model, {
      ...vacancy,
      fsm: dFSM._id
    })
  }

  let canSave = false
  $: canSave = vacancy.name !== '' && fsmId !== undefined
</script>

<Card label={recruiting.string.AddVacancy} {canSave} okAction={createVacancy} on:close={() => dispatch('close')}>
  <Grid column={1} rowGap={24}>
    <EditBox label={recruiting.string.VacancyTitle} bind:value={vacancy.name} focus />
    <EditBox label={recruiting.string.Company} bind:value={vacancy.company} />
  </Grid>
  <svelte:fragment slot="pool">
    <Dropdown items={fsmItems} bind:selected={fsmId} label={recruiting.string.Flow} />
  </svelte:fragment>
</Card>
