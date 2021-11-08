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
  import { EditBox, Component, YesNoCard, Label } from '@anticrm/ui'
  import recruiting from '@anticrm/recruiting'
  import type { Candidate } from '@anticrm/recruiting'
  import attachment from '@anticrm/attachment'
  import CandidateApplication from './CandidateApplication.svelte'
  import AvatarView from './AvatarView.svelte'
  import SocialLinks from './SocialLinks.svelte'

  const dispatch = createEventDispatcher()

  export let candidate: Candidate | undefined
  export let min: boolean = false

  function onUpdate () {
    dispatch('update')
  }
</script>

{#if candidate !== undefined}
  <div class="flex-row-center">
    <AvatarView
      bind:src={candidate.avatar}
      objectId={candidate._id}
      objectClass={candidate._class}
      space={candidate.space}
      on:update={onUpdate}
    />
    <div class="flex-col">
      <div class="name">
        <EditBox placeholder="John" maxWidth="320px" bind:value={candidate.firstName} focus on:blur={onUpdate} />
      </div>
      <div class="name">
        <EditBox placeholder="Appleseed" maxWidth="320px" bind:value={candidate.lastName} on:blur={onUpdate} />
      </div>
      <div class="title">
        <EditBox placeholder="Title" maxWidth="152px" bind:value={candidate.title} on:blur={onUpdate} />
      </div>
      {#if min}
        <div class="city">
          <EditBox placeholder="Location" maxWidth="152px" bind:value={candidate.address.city} on:blur={onUpdate} />
        </div>
      {/if}
      <div class="socialLinks">
        <SocialLinks
          bind:socialLinks={candidate.socialLinks}
          width={min ? 152 : undefined}
          editable
          on:update={onUpdate}
        />
      </div>
    </div>
  </div>
  {#if min}
    <div class="separator" />
    <Label label={recruiting.string.WorkPreferences} />
    <div class="flex-between work-preference">
      <Label label={recruiting.string.Onsite} />
      <YesNoCard bind:value={candidate.workPreference.onsite} on:update={onUpdate} />
    </div>
    <div class="flex-between work-preference">
      <Label label={recruiting.string.Remote} />
      <YesNoCard bind:value={candidate.workPreference.remote} on:update={onUpdate} />
    </div>
  {:else}
    <CandidateApplication {candidate} />
    <Component
      is={attachment.component.Attachments}
      props={{ objectId: candidate._id, objectClass: candidate._class, space: candidate.space, editable: true }}
    />
  {/if}
{/if}

<style lang="scss">
  .name,
  .city,
  .title {
    font-weight: 500;
  }

  .city,
  .socialLinks,
  .title {
    font-size: 0.75rem;
    color: var(--theme-content-accent-color);
  }

  .socialLinks {
    margin-top: 16px;
  }

  .title {
    margin-top: 8px;
  }

  .name {
    font-weight: 500;
    font-size: 1.25rem;
    color: var(--theme-caption-color);
  }

  .separator {
    margin: 16px 0;
    height: 1px;
    background-color: var(--theme-card-divider);
  }

  .work-preference {
    margin-top: 16px;
  }
</style>
