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
  import { Card, Dropdown, DropdownItem } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import type { Candidate, CandidatePoolSpace } from '@anticrm/recruiting'
  import { CandidateStatus } from '@anticrm/recruiting'
  import recruiting from '@anticrm/recruiting'
  import CandidateEditor from './CandidateEditor.svelte'
  import { QueryUpdater } from '@anticrm/presentation'

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
  <CandidateEditor min bind:candidate />
  <Dropdown slot="pool" items={poolItems} bind:selected={pool} label={recruiting.string.CandidatePool} />
</Card>
