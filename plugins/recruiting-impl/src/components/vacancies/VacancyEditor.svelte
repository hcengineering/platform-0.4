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
  import { Ref } from '@anticrm/core'
  import type { FSM } from '@anticrm/fsm'
  import { fsmPlugin } from '@anticrm/fsm-impl'
  import type { QueryUpdater } from '@anticrm/presentation'
  import type { VacancySpace } from '@anticrm/recruiting'
  import recruiting from '@anticrm/recruiting'
  import { Component, DropdownItem } from '@anticrm/ui'
  import {
    DatePicker,
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
  import attachment from '@anticrm/attachment'

  import Details from '../icons/Details.svelte'

  const dispatch = createEventDispatcher()

  export let vacancy: VacancySpace
  export let min: boolean = false

  const client = getClient()
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

  function onDueDateChange (event: any) {
    vacancy.dueDate = event.detail.getTime()
    onChange()
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
</script>

{#if min}
  <EditBox label={recruiting.string.VacancyTitle} bind:value={vacancy.name} on:blur={onChange} />
  <EditBox label={recruiting.string.Company} bind:value={vacancy.company} on:blur={onChange} />
  {#if vacancy._id === undefined}
    <Dropdown items={fsmItems} bind:selected={selectedFSMId} title={recruiting.string.Flow} />
  {/if}
{:else}
  <Section label={recruiting.string.GeneralInformation} icon={IconFile}>
    <Grid column={2}>
      <EditBox label={recruiting.string.VacancyTitle} bind:value={vacancy.name} on:blur={onChange} />
      <EditBox label={recruiting.string.Company} bind:value={vacancy.company} on:blur={onChange} />
      {#if vacancy._id === undefined}
        <Dropdown items={fsmItems} bind:selected={selectedFSMId} title={recruiting.string.Flow} />
      {:else}
        <div />
      {/if}
      <DatePicker
        value={vacancy.dueDate !== undefined ? new Date(vacancy.dueDate) : undefined}
        on:change={onDueDateChange}
        label={recruiting.string.Due}
        noLabel={recruiting.string.NoDue}
      />
      <ToggleWithLabel
        label={recruiting.string.MakePrivate}
        description={recruiting.string.MakePrivateDescription}
        bind:on={vacancy.private}
        on:change={onChange}
      />
    </Grid>
  </Section>
  <Section label={recruiting.string.VacancyNotes} icon={IconEdit}>
    <Grid column={1}>
      <TextArea label={recruiting.string.Summary} bind:value={vacancy.details.summary} on:blur={onChange} />
      <TextArea label={recruiting.string.Qualification} bind:value={vacancy.details.qualification} on:blur={onChange} />
      <TextArea label={recruiting.string.Experience} bind:value={vacancy.details.experience} on:blur={onChange} />
    </Grid>
  </Section>
  <Section label={recruiting.string.VacancyDetails} icon={Details}>
    <Grid column={2}>
      <EditBox label={recruiting.string.Location} bind:value={vacancy.location} on:blur={onChange} />
      <EditBox label={recruiting.string.VacancyType} bind:value={vacancy.type} on:blur={onChange} />
    </Grid>
  </Section>
  {#if vacancy._id !== undefined}
    <Section label={attachment.string.Attachments} icon={IconFile}>
      <Component
        is={attachment.component.Attachments}
        props={{ objectId: vacancy._id, objectClass: vacancy._class, space: vacancy._id, editable: true }}
      />
    </Section>
  {/if}
{/if}
