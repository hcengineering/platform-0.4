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
  import type { Data } from '@anticrm/core'
  import { EditBox, Section, Grid, IconFile, TextArea, PersonSummary } from '@anticrm/ui'
  import type { Candidate } from '@anticrm/recruiting'
  import recruiting from '@anticrm/recruiting'

  import Address from '../icons/Address.svelte'
  import CandidateApplication from './CanidateApplication.svelte'

  const dispatch = createEventDispatcher()

  export let candidate: (Candidate & Data<Required<Candidate>>) | undefined

  function onUpdate () {
    dispatch('update')
  }
</script>

{#if candidate !== undefined}
  <div>
    <PersonSummary person={candidate} subtitle={candidate.employment.position} />
    <Section label={recruiting.string.PersonalInformation} icon={IconFile}>
      <Grid column={2}>
        <EditBox label={recruiting.string.FirstName} bind:value={candidate.firstName} on:blur={onUpdate} />
        <EditBox label={recruiting.string.LastName} bind:value={candidate.lastName} on:blur={onUpdate} />
        <EditBox label={recruiting.string.Email} bind:value={candidate.email} on:blur={onUpdate} />
        <EditBox label={recruiting.string.Phone} bind:value={candidate.phone} on:blur={onUpdate} />
        <EditBox label={recruiting.string.Position} bind:value={candidate.employment.position} on:blur={onUpdate} />
        <EditBox
          label={recruiting.string.SalaryExpectation}
          bind:value={candidate.salaryExpectation}
          on:blur={onUpdate}
        />
      </Grid>
    </Section>
    <Section label={recruiting.string.Details} icon={IconFile}>
      <TextArea bind:value={candidate.bio} label={recruiting.string.Bio} on:blur={onUpdate} />
    </Section>
    <Section label={recruiting.string.Address} icon={Address}>
      <Grid column={2}>
        <EditBox label={recruiting.string.Street} bind:value={candidate.address.street} on:blur={onUpdate} />
        <EditBox label={recruiting.string.City} bind:value={candidate.address.city} on:blur={onUpdate} />
        <EditBox label={recruiting.string.Zip} bind:value={candidate.address.zip} on:blur={onUpdate} />
        <EditBox label={recruiting.string.Country} bind:value={candidate.address.country} on:blur={onUpdate} />
      </Grid>
    </Section>
    {#if candidate._id !== undefined}
      <Section label={recruiting.string.ApplicationInfo} icon={IconFile}>
        <CandidateApplication {candidate} />
      </Section>
    {/if}
  </div>
{/if}
