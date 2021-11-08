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
  import type { Ref } from '@anticrm/core'
  import type { Candidate } from '@anticrm/recruiting'
  import recruiting from '@anticrm/recruiting'
  import { getClient } from '@anticrm/workbench'
  import { Panel } from '@anticrm/ui'
  import type { QueryUpdater } from '@anticrm/presentation'
  import CandidateEditor from './CandidateEditor.svelte'
  import Contact from '../icons/Contact.svelte'
  import CandidateHeader from './CandidateHeader.svelte'

  export let id: Ref<Candidate>

  const dispatch = createEventDispatcher()

  const client = getClient()
  let candidate: Candidate | undefined
  let prevCandidate: Candidate | undefined
  let lqCandidates: QueryUpdater<Candidate> | undefined

  $: lqCandidates = client.query(lqCandidates, recruiting.class.Candidate, { _id: id }, ([first]) => {
    const adjustedRes = {
      ...first,
      _id: first._id as Ref<Candidate>,
      firstName: first.firstName ?? '',
      lastName: first.lastName ?? '',
      avatar: first.avatar ?? '',
      bio: first.bio ?? '',
      address: first.address ?? {},
      salaryExpectation: first.salaryExpectation
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
</script>

{#if candidate !== undefined}
  <Panel
    icon={Contact}
    title={candidate.firstName + ' ' + candidate.lastName}
    on:close={() => {
      dispatch('close')
    }}
  >
    <svelte:fragment slot="actions">
      <CandidateHeader bind:candidate on:update={onUpdate} />
    </svelte:fragment>
    <CandidateEditor bind:candidate on:update={onUpdate} />
  </Panel>
{/if}
