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
  import { generateId, Ref, Space } from '@anticrm/core'
  import { Card, Dropdown, DropdownItem, EditBox, Label, YesNoCard } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import type { Candidate, CandidatePoolSpace } from '@anticrm/recruiting'
  import recruiting, { CandidateStatus } from '@anticrm/recruiting'
  import { QueryUpdater } from '@anticrm/presentation'
  import AvatarView from './AvatarView.svelte'
  import SocialLinks from './SocialLinks.svelte'

  const dispatch = createEventDispatcher()

  export let space: Space
  let pool: Ref<CandidatePoolSpace> = space._id
  const client = getClient()
  const accountId = client.accountId()

  $: candidate = {
    _id: generateId(),
    space: pool,
    _class: recruiting.class.Candidate,
    firstName: '',
    lastName: '',
    avatar: '',
    email: '',
    bio: '',
    socialLinks: [],
    createOn: 0,
    modifiedBy: client.accountId(),
    modifiedOn: 0,
    status: CandidateStatus.AvailableForHire,
    title: '',
    comments: [],
    attachments: [],
    applicants: [],
    address: {
      city: ''
    },
    workPreference: {}
  } as Candidate

  async function create () {
    await client.createDoc(candidate._class, candidate.space, candidate, candidate._id)
  }

  let poolItems: DropdownItem[] = []
  let poolQuery: QueryUpdater<CandidatePoolSpace> | undefined
  $: poolQuery = client.query(poolQuery, recruiting.class.CandidatePoolSpace, {}, (res) => {
    const pools = res.filter((space) => !space.private || space.members.includes(accountId))
    poolItems = pools.map((v) => ({
      id: v._id,
      label: v.name
    }))
  })
</script>

<Card
  label={recruiting.string.CreateCandidate}
  canSave={candidate.firstName.length > 0 && candidate.lastName.length > 0}
  okAction={create}
  on:close={() => dispatch('close')}
>
  <div class="flex-row-center mb-4">
    <AvatarView
      bind:src={candidate.avatar}
      objectId={candidate._id}
      objectClass={candidate._class}
      space={candidate.space}
    />
    <div class="flex-col ml-4">
      <div class="fs-title">
        <EditBox placeholder="John" maxWidth="152px" bind:value={candidate.firstName} focus />
      </div>
      <div class="fs-title mb-2">
        <EditBox placeholder="Appleseed" maxWidth="152px" bind:value={candidate.lastName} />
      </div>
      <div class="fs-subtitle">
        <EditBox placeholder="Title" maxWidth="152px" bind:value={candidate.title} />
      </div>
      <div class="fs-subtitle">
        <EditBox placeholder="Location" maxWidth="152px" bind:value={candidate.address.city} />
      </div>
    </div>
  </div>
  <SocialLinks bind:value={candidate.socialLinks} editable />
  <div class="separator" />
  <Label label={recruiting.string.WorkPreferences} />
  <div class="flex-between mt-4">
    <Label label={recruiting.string.Onsite} />
    <YesNoCard bind:value={candidate.workPreference.onsite} />
  </div>
  <div class="flex-between mt-4">
    <Label label={recruiting.string.Remote} />
    <YesNoCard bind:value={candidate.workPreference.remote} />
  </div>

  <Dropdown slot="pool" items={poolItems} bind:selected={pool} label={recruiting.string.CandidatePool} />
</Card>

<style lang="scss">
  .separator {
    margin: 1rem 0;
    height: 1px;
    background-color: var(--theme-card-divider);
  }
</style>
