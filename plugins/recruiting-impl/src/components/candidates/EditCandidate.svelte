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
  import { deepEqual } from 'fast-equals'
  import cloneDeep from 'lodash.clonedeep'
  import type { Data, Ref } from '@anticrm/core'
  import type { Candidate } from '@anticrm/recruiting'
  import recruiting from '@anticrm/recruiting'
  import { getClient } from '@anticrm/workbench'
  import type { WorkbenchRoute } from '@anticrm/workbench'
  import { getRouter, IconClose, ScrollBox } from '@anticrm/ui'
  import type { QueryUpdater } from '@anticrm/presentation'
  import CandidateEditor from './CandidateEditor.svelte'

  export let id: Ref<Candidate>

  const client = getClient()
  const router = getRouter<WorkbenchRoute>()
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
    router.navigate({ itemId: undefined })
  }
</script>

{#if candidate !== undefined}
  <div class="header">
    <div class="close" on:click={onClose}>
      <IconClose size={16} />
    </div>
  </div>
  <ScrollBox autoscrollable vertical>
    <CandidateEditor {candidate} on:update={onUpdate} />
  </ScrollBox>
{/if}

<style lang="scss">
  .header {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding-bottom: 20px;
  }

  .close {
    margin-left: 12px;
    opacity: 0.4;
    cursor: pointer;
    &:hover {
      opacity: 1;
    }
  }
</style>
