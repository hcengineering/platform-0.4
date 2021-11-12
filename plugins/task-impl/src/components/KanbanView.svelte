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
  import type { DocumentQuery, Ref, Space } from '@anticrm/core'
  import { getClient } from '@anticrm/workbench'
  import { deepEqual } from 'fast-equals'
  import { Kanban } from '@anticrm/ui'
  import KanbanCard from './KanbanCard.svelte'

  import { getStatusColor } from '../plugin'
  import type { QueryUpdater } from '@anticrm/presentation'
  import type { Task } from '@anticrm/task'
  import task from '@anticrm/task'
  import { NotificationClient, SpaceLastViews } from '@anticrm/notification'
  import { getContext } from 'svelte'
  import { Writable } from 'svelte/store'

  export let query: DocumentQuery<Task>
  let prevQuery: DocumentQuery<Task>

  const statusByName = new Map(Object.entries(TaskStatuses).map(([k, v]) => [v, k]))

  const client = getClient()
  const notificationClient = new NotificationClient(client)
  const spacesLastViews = getContext('spacesLastViews') as Writable<Map<Ref<Space>, SpaceLastViews>>

  let lq: QueryUpdater<Task> | undefined

  const states = Object.entries(TaskStatuses).map(([k, v]) => ({
    _id: k,
    name: v,
    color: getStatusColor(v)
  }))

  $: if (!deepEqual(prevQuery, query)) {
    prevQuery = query

    lq = client.query(lq, task.class.Task, query, (result) => {
      tasks = result.map((item) => ({
        ...item,
        state: statusByName.get(item.status) ?? ''
      }))
    })
  }

  async function onDrop (event: CustomEvent<any>) {
    const { item, state } = event.detail
    const tState = state as keyof typeof TaskStatuses
    const doc = tasks.find((p) => p._id === item)

    await client.updateDoc<Task>(doc!._class, doc!.space, item, {
      status: TaskStatuses[tState]
    })
    const spaceLastViews = $spacesLastViews.get(doc!.space)
    if (spaceLastViews !== undefined) {
      await notificationClient.readNow(spaceLastViews, doc!._id, true)
    }
  }

  type TaskItem = Task & { state: string }
  let tasks: TaskItem[] = []
  let items = new Map<string, TaskItem[]>()
  $: items = new Map(states.map((state) => [state._id, tasks.filter((task) => task.state === state._id)]))
</script>

<Kanban {items} {states} cardComponent={KanbanCard} on:drop={onDrop} panelEditDisabled={true} />
