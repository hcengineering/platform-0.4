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
  import { deepEqual } from 'fast-equals'
  import cloneDeep from 'lodash.clonedeep'
  import type { Data, Ref } from '@anticrm/core'
  import type { Candidate } from '@anticrm/recruiting'
  import recruiting from '@anticrm/recruiting'
  import { getClient, selectDocument } from '@anticrm/workbench'
  import { Panel, EditBox, IconClose, ScrollBox } from '@anticrm/ui'
  import type { QueryUpdater } from '@anticrm/presentation'
  import CandidateEditor from './CandidateEditor.svelte'
  import Contact from '../icons/Contact.svelte'
  import AvatarView from './AvatarView.svelte'

  export let id: Ref<Candidate>

  const dispatch = createEventDispatcher()

  const client = getClient()
  let candidate: (Candidate & Required<Data<Candidate>>) | undefined
  let prevCandidate: (Candidate & Required<Data<Candidate>>) | undefined
  let lqCandidates: QueryUpdater<Candidate> | undefined

  $: lqCandidates = client.query(lqCandidates, recruiting.class.Candidate, { _id: id }, ([first]) => {
    const adjustedRes = {
      ...first,
      _id: first._id as Ref<Candidate & Required<Data<Candidate>>>,
      firstName: first.firstName ?? '',
      lastName: first.lastName ?? '',
      avatar: first.avatar ?? '',
      bio: first.bio ?? '',
      phone: first.phone ?? '',
      address: first.address ?? {
        city: '',
        country: '',
        street: '',
        zip: ''
      },
      salaryExpectation: first.salaryExpectation ?? 0
    }

    candidate = adjustedRes
    prevCandidate = cloneDeep(adjustedRes)
  })

  async function onUpdate () {
    if (candidate === undefined || prevCandidate === undefined) {
      return
    }

    const b: any = candidate
    const a: any = prevCandidate

    const keys = Object.keys(candidate)
    const update = keys.reduce((res, key) => (deepEqual(a[key], b[key]) ? res : { ...res, [key]: b[key] }), {})

    if (Object.getOwnPropertyNames(update).length === 0) {
      return
    }

    await client.updateDoc(recruiting.class.Candidate, a.space, a._id, update)
  }

  function onClose () {
    selectDocument()
  }
</script>

{#if candidate !== undefined}
  <Panel icon={Contact} title={candidate.firstName + ' ' + candidate.lastName} object={candidate} on:close={() => { dispatch('close') }}>

    <div class="flex-row-center">
      <AvatarView src={candidate.avatar} />
      <div class="flex-col">
        <div class="name"><EditBox placeholder="John" maxWidth="320px" bind:value={candidate.firstName} /></div>
        <div class="name"><EditBox placeholder="Appleseed" maxWidth="320px" bind:value={candidate.lastName} /></div>
        <div class="title"></div>
      </div>
    </div>
  
  </Panel>
{/if}

<style lang="scss">
  .name {
    font-weight: 500;
    font-size: 1.25rem;
    color: var(--theme-caption-color);
  }
  .title {
    margin-top: 4px;
    font-size: .75rem;
  }
</style>
