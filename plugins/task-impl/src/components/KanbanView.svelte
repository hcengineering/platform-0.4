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
  import { TaskStatuses } from '@anticrm/task'
  import type { DocumentQuery } from '@anticrm/core'
  import { getClient } from '@anticrm/workbench'

  import { Kanban } from '@anticrm/ui'
  import KanbanCard from './KanbanCard.svelte'

  import { getStatusColor } from '../plugin'
  import type { QueryUpdater } from '@anticrm/presentation'
  import type { Task } from '@anticrm/task'
  import task from '@anticrm/task'

  export let query: DocumentQuery<Task>
  let prevQuery: DocumentQuery<Task>

  const statusByName = new Map(Object.entries(TaskStatuses).map(([k, v]) => [v, k]))

  const client = getClient()
  let lq: QueryUpdater<Task> | undefined

  const states = Object.entries(TaskStatuses).map(([k, v]) => ({
    _id: k,
    name: v,
    color: getStatusColor(v)
  }))

  $: if (query !== prevQuery) {
    prevQuery = query

    lq = client.query(lq, task.class.Task, query, (result) => {
      items = result.map((item) => ({
        ...item,
        state: statusByName.get(item.status) ?? ''
      }))
    })
  }

  async function onDrop (event: CustomEvent<any>) {
    const { item, state } = event.detail
    const tState = state as keyof typeof TaskStatuses
    const doc = items.find(p => p._id === item)

    await client.updateDoc<Task>(doc!._class, doc!.space, item, {
      status: TaskStatuses[tState]
    })
  }

  let items: (Task & { state: string })[] = []
</script>

<Kanban {items} {states} cardComponent={KanbanCard} on:drop={onDrop} />
