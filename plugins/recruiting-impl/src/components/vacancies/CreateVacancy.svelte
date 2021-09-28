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
  import type { Data } from '@anticrm/core'
  import core from '@anticrm/core'
  import type { FSM } from '@anticrm/fsm'
  import { fsmPlugin } from '@anticrm/fsm-impl'
  import { getPlugin } from '@anticrm/platform'
  import type { QueryUpdater } from '@anticrm/presentation'
  import type { Vacancy, VacancySpace } from '@anticrm/recruiting'
  import recruiting from '@anticrm/recruiting'
  import type { DropdownItem } from '@anticrm/ui'
  import {
    DatePicker,
    Dialog,
    Dropdown,
    EditBox,
    Grid,
    IconEdit,
    IconFile,
    Section,
    TextArea,
    ToggleWithLabel
  } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import Details from '../icons/Details.svelte'

  const client = getClient()
  let selectedFSM: FSM | undefined = undefined
  $: selectedFSM = fsmTmpls.find((x) => x._id === selectedFSMId)

  let fsmTmpls: FSM[] = []
  let lq: QueryUpdater<FSM> | undefined
  lq = client.query(lq, fsmPlugin.class.FSM, { clazz: recruiting.class.VacancySpace, isTemplate: true }, (result) => {
    fsmTmpls = result
    if (selectedFSM === undefined) {
      selectedFSM = result[0]
    }
  })

  const vacancy: Data<VacancySpace & Required<Vacancy>> = {
    name: '',
    description: '',
    details: {
      summary: '',
      qualification: '',
      experience: ''
    },
    company: '',
    location: '',
    type: '',
    dueDate: new Date().getTime(),
    fsm: '' as VacancySpace['fsm'],
    private: true,
    members: [client.accountId()]
  }

  async function createVacancy () {
    if (!selectedFSM) {
      return
    }

    const fsmP = await getPlugin(fsmPlugin.id)
    const dFSM = await fsmP.duplicateFSM(selectedFSM._id)

    if (!dFSM) {
      return
    }

    client.createDoc(recruiting.class.VacancySpace, core.space.Model, {
      ...vacancy,
      fsm: dFSM._id
    })
  }

  function onDateChange (event: any) {
    vacancy.dueDate = event.details.getTime()
  }

  let fsmItems: DropdownItem[] = []
  $: fsmItems = fsmTmpls.map((x) => ({
    id: x._id,
    label: x.name
  }))
  let selectedFSMId: string | undefined
</script>

<Dialog label={recruiting.string.AddVacancy} okLabel={recruiting.string.AddVacancy} okAction={createVacancy} on:close>
  <Section label={recruiting.string.GeneralInformation} icon={IconFile}>
    <Grid column={2}>
      <EditBox label={recruiting.string.VacancyTitle} bind:value={vacancy.name} />
      <EditBox label={recruiting.string.Company} bind:value={vacancy.company} />
      <Dropdown items={fsmItems} bind:selected={selectedFSMId} title={recruiting.string.Flow} />
      <DatePicker value={new Date(vacancy.dueDate)} on:change={onDateChange} label={recruiting.string.Due} />
      <ToggleWithLabel
        label={recruiting.string.MakePrivate}
        description={recruiting.string.MakePrivateDescription}
        bind:on={vacancy.private}
      />
    </Grid>
  </Section>
  <Section label={recruiting.string.VacancyNotes} icon={IconEdit}>
    <Grid column={1}>
      <TextArea label={recruiting.string.Summary} bind:value={vacancy.details.summary} />
      <TextArea label={recruiting.string.Qualification} bind:value={vacancy.details.qualification} />
      <TextArea label={recruiting.string.Experience} bind:value={vacancy.details.experience} />
    </Grid>
  </Section>
  <Section label={recruiting.string.VacancyDetails} icon={Details}>
    <Grid column={2}>
      <EditBox label={recruiting.string.Location} bind:value={vacancy.location} />
      <EditBox label={recruiting.string.VacancyType} bind:value={vacancy.type} />
    </Grid>
  </Section>
</Dialog>
