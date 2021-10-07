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
  import type { Data, Space } from '@anticrm/core'
  import { Card, EditBox } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import type { Candidate } from '@anticrm/recruiting'
  import { CandidateStatus } from '@anticrm/recruiting'
  import recruiting from '@anticrm/recruiting'
  import Avatar from '../icons/Avatar.svelte'

  const dispatch = createEventDispatcher()

  export let space: Space
  const client = getClient()

  const candidate: Candidate & Data<Required<Candidate>> = {
    firstName: '',
    lastName: '',
    avatar: 'https://robohash.org/prefix?set=set4',
    email: '',
    phone: '',
    bio: '',
    status: CandidateStatus.AvailableForHire,
    employment: {
      position: '',
      experience: 0
    },
    address: {
      city: '',
      country: '',
      street: '',
      zip: ''
    },
    salaryExpectation: 0,
    resume: ''
  } as Candidate & Data<Required<Candidate>>

  async function create () {
    await client.createDoc(recruiting.class.Candidate, space._id, candidate)
  }

  let kl: boolean = false
</script>

<Card
  label={recruiting.string.AddCandidate}
  okLabel={'Save'}
  canSave={candidate.firstName.length > 0 && candidate.lastName.length > 0}
  okAction={create}
  on:update={(ev) => {
    dispatch('update', ev.detail)
  }}
  on:close={() => dispatch('close')}
>
  <div class="flex-row-center">
    <div class="avatar-container">
      <div class="flex-center avatar-shadow">
        {#if kl}
          <div class="bg-avatar"><Avatar /></div>
        {:else}
          <div class="bg-avatar">
            <img
              class="img-avatar"
              src={`https://robohash.org/prefix${candidate.firstName}${candidate.lastName}?set=set4`}
              alt="Avatar"
            />
          </div>
        {/if}
      </div>
      <div
        class="flex-center avatar"
        on:click={() => {
          kl = !kl
        }}
      >
        <div class="border" />
        {#if kl}
          <Avatar />
        {:else}
          <img
            class="img-avatar"
            src={`https://robohash.org/prefix${candidate.firstName}${candidate.lastName}?set=set4`}
            alt="Avatar"
          />
        {/if}
      </div>
    </div>

    <div class="flex-col">
      <div class="name"><EditBox placeholder="John" maxWidth="152px" bind:value={candidate.firstName} /></div>
      <div class="name"><EditBox placeholder="Appleseed" maxWidth="152px" bind:value={candidate.lastName} /></div>
      <div class="title">
        <EditBox placeholder="Title" maxWidth="152px" bind:value={candidate.employment.position} />
      </div>
      <div class="city"><EditBox placeholder="Location" maxWidth="152px" bind:value={candidate.address.city} /></div>
    </div>
  </div>
  <svelte:fragment slot="pool">Pool</svelte:fragment>
  <svelte:fragment slot="contacts">Contacts</svelte:fragment>
</Card>

<style lang="scss">
  @import '../../../../../packages/theme/styles/mixins.scss';

  .avatar-container {
    flex-shrink: 0;
    position: relative;
    margin-right: 16px;
    width: 96px;
    height: 96px;
    user-select: none;
  }
  .avatar-shadow {
    position: absolute;
    width: 96px;
    height: 96px;

    .bg-avatar {
      transform: scale(1.1);
      filter: blur(10px);
      opacity: 0.5;
    }
  }
  .avatar {
    overflow: hidden;
    position: absolute;
    width: 96px;
    height: 96px;
    border-radius: 50%;
    filter: var(--theme-avatar-shadow);
    cursor: pointer;

    &::after {
      content: '';
      @include bg-layer(var(--theme-avatar-hover), 0.5);
      z-index: -1;
    }
    &::before {
      content: '';
      @include bg-layer(var(--theme-avatar-bg), 0.1);
      backdrop-filter: blur(25px);
      z-index: -2;
    }
    .border {
      @include bg-fullsize;
      border: 2px solid var(--theme-avatar-border);
      border-radius: 50%;
    }
  }
  .img-avatar {
    width: 96px;
    height: 96px;
  }

  .name {
    font-weight: 500;
    font-size: 1.25rem;
    color: var(--theme-caption-color);
  }
  .title,
  .city {
    font-weight: 500;
    font-size: 0.75rem;
    color: var(--theme-content-accent-color);
  }
  .title {
    margin-top: 8px;
  }
</style>
