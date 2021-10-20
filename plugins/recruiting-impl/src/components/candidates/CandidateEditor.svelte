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
  import { EditBox, Section, Grid, IconFile, TextArea } from '@anticrm/ui'
  import type { Candidate } from '@anticrm/recruiting'
  import recruiting from '@anticrm/recruiting'

  import Address from '../icons/Address.svelte'
  import CandidateApplication from './CandidateApplication.svelte'
  import AvatarView from './AvatarView.svelte'

  const dispatch = createEventDispatcher()

  export let candidate: (Candidate & Data<Required<Candidate>>) | undefined
  export let min: boolean = false

  function onUpdate () {
    dispatch('update')
  }

  function onNameUpdate () {
    if (candidate === undefined) {
      return
    }

    candidate.avatar = `https://robohash.org/prefix${candidate.firstName}${candidate.lastName}?set=set4`
    onUpdate()
  }
</script>

{#if candidate !== undefined}
  {#if min}
    <div class="flex-row-center">
      <AvatarView src={candidate.avatar} />
      <div class="flex-col">
        <div class="name">
          <EditBox placeholder="John" maxWidth="320px" bind:value={candidate.firstName} focus on:blur={onNameUpdate} />
        </div>
        <div class="name">
          <EditBox placeholder="Appleseed" maxWidth="320px" bind:value={candidate.lastName} on:blur={onNameUpdate} />
        </div>
        <div class="title">
          <EditBox placeholder="Title" maxWidth="152px" bind:value={candidate.employment.position} />
        </div>
        <div class="city"><EditBox placeholder="Location" maxWidth="152px" bind:value={candidate.address.city} /></div>
      </div>
    </div>
  {:else}
    <div>
      <div class="flex-row-center">
        <AvatarView src={candidate.avatar} />
        <div class="flex-col">
          <div class="name">
            <EditBox
              placeholder="John"
              maxWidth="320px"
              bind:value={candidate.firstName}
              focus
              on:blur={onNameUpdate}
            />
          </div>
          <div class="name">
            <EditBox placeholder="Appleseed" maxWidth="320px" bind:value={candidate.lastName} on:blur={onNameUpdate} />
          </div>
        </div>
      </div>
      <Section label={recruiting.string.PersonalInformation} icon={IconFile}>
        <Grid column={2}>
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
{/if}

<style lang="scss">
  .name,
  .city,
  .title {
    font-weight: 500;
  }

  .city,
  .title {
    font-size: 0.75rem;
    color: var(--theme-content-accent-color);
  }

  .title {
    margin-top: 8px;
  }

  .name {
    font-weight: 500;
    font-size: 1.25rem;
    color: var(--theme-caption-color);
  }
</style>
