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
  import { onDestroy } from 'svelte'
  import { Table, Label } from '@anticrm/ui'
  import type { Ref, Space } from '@anticrm/core'
  import { getClient, showModal } from '@anticrm/workbench'
  import { Candidate } from '@anticrm/recruiting'

  import CandidateCmp from './Candidate.svelte'

  import recruiting from '../../plugin'

  export let currentSpace: Ref<Space> | undefined
  let prevSpace: Ref<Space> | undefined

  const columns = [
    {
      label: recruiting.string.Name,
      properties: [{ key: 'name', property: 'label' }],
      component: Label
    },
    {
      label: recruiting.string.Position,
      properties: [{ key: 'position', property: 'label' }],
      component: Label
    },
    {
      label: recruiting.string.Location,
      properties: [{ key: 'location', property: 'label' }],
      component: Label
    }
  ]

  const client = getClient()
  let data: Candidate[] = []
  let unsub = () => {}
  $: if (currentSpace !== prevSpace) {
    unsub()
    unsub = () => {}
    prevSpace = currentSpace

    if (currentSpace !== undefined) {
      unsub = client.query(recruiting.class.Candidate, { space: currentSpace }, (result) => (data = result))
    }
  }

  onDestroy(unsub)
</script>

<Table {data} {columns} on:rowClick={(event) => showModal(CandidateCmp, { id: event.detail.id })} />
