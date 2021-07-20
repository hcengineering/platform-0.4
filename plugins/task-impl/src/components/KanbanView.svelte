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

  import { Task, TaskStatuses } from '@anticrm/task'
  import { Ref, Space } from '@anticrm/core'
  import { getClient } from '@anticrm/workbench'

  import { Kanban } from '@anticrm/ui'
  import KanbanCard from './KanbanCard.svelte'

  import task, { getStatusColor } from '../plugin'

  export let currentSpace: Ref<Space> | undefined
  let prevSpace: Ref<Space> | undefined

  const statusByName = new Map(Object.entries(TaskStatuses).map(([k, v]) => [v, k]))

  const client = getClient()
  let unsub = () => {}
  const states = Object.entries(TaskStatuses).map(([k, v]) => ({
    _id: k,
    name: v,
    color: getStatusColor(v)
  }))

  $: if (currentSpace !== prevSpace) {
    unsub()
    unsub = () => {}
    prevSpace = currentSpace

    if (currentSpace !== undefined) {
      unsub = client.query(task.class.Task, { space: currentSpace }, (result) => {
        items = result.map((item) => ({
          ...item,
          state: statusByName.get(item.status) ?? ''
        }))
      })
    }
  }

  async function onDrop (event: CustomEvent<any>) {
    if (currentSpace === undefined) {
      return
    }

    const { item, state } = event.detail
    const tState = state as keyof typeof TaskStatuses

    await client.updateDoc(task.class.Task, currentSpace, item, {
      status: TaskStatuses[tState]
    })
  }

  onDestroy(() => {
    unsub()
  })

  let items: (Task & { state: string })[] = []
</script>

<Kanban {items} {states} cardComponent={KanbanCard} on:drop={onDrop} />
