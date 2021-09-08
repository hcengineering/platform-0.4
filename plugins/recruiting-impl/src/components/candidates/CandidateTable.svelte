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
  import { Table, Label, getRouter } from '@anticrm/ui'
  import type { Ref, Space } from '@anticrm/core'
  import { getClient } from '@anticrm/workbench'
  import type { WorkbenchRoute } from '@anticrm/workbench'
  import type { Candidate } from '@anticrm/recruiting'
  import recruiting from '@anticrm/recruiting'
  import type { QueryUpdater } from '@anticrm/presentation'

  export let currentSpace: Ref<Space> | undefined
  let prevSpace: Ref<Space> | undefined

  const columns = [
    {
      label: recruiting.string.FirstName,
      properties: [{ key: 'firstName', property: 'label' }],
      component: Label
    },
    {
      label: recruiting.string.LastName,
      properties: [{ key: 'lastName', property: 'label' }],
      component: Label
    }
  ]

  const client = getClient()
  const router = getRouter<WorkbenchRoute>()
  let data: Candidate[] = []
  let lq: QueryUpdater<Candidate> | undefined
  $: if (currentSpace !== prevSpace) {
    prevSpace = currentSpace

    if (currentSpace !== undefined) {
      lq = client.query(lq, recruiting.class.Candidate, { space: currentSpace }, (result) => (data = result))
    }
  }

  function onClick (event: any) {
    router.navigate({ itemId: event.detail.id })
  }
</script>

<Table {data} {columns} showHeader on:rowClick={onClick} />
