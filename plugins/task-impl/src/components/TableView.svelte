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
  import core from '@anticrm/core'
  import type { Ref, Doc, DocumentQuery, Account } from '@anticrm/core'
  import type { QueryUpdater } from '@anticrm/presentation'
  import task from '@anticrm/task'
  import type { Task } from '@anticrm/task'
  import { getClient } from '@anticrm/workbench'
  import { Table, Label, UserInfo, DateTime, closePopup, showPopup } from '@anticrm/ui'
  import { deepEqual } from 'fast-equals'
  import EditTask from './EditTask.svelte'
  import TaskStatus from './TaskStatus.svelte'
  import LimitHeader from './LimitHeader.svelte'

  export let query: DocumentQuery<Task>
  let prevQuery: DocumentQuery<Task> | undefined

  let skip = 0
  let total = 0
  const limit = 150

  const columns = [
    { label: task.string.TaskID, properties: [{ key: 'shortRefId', property: 'label' }], component: Label },
    { label: task.string.TaskName, properties: [{ key: 'name', property: 'label' }], component: Label },
    {
      label: task.string.Status,
      properties: [{ key: 'status', property: 'value' }],
      component: TaskStatus,
      width: 150
    },
    { label: task.string.Assignee, properties: [{ key: 'asigneeUser', property: 'user' }], component: UserInfo },
    {
      label: task.string.Due,
      properties: [
        { key: 'dueTo', property: 'value' },
        { value: 'true', property: 'dateOnly' }
      ],
      component: DateTime,
      width: 150
    }
  ]

  const client = getClient()
  let data: Doc[] = []

  let lq: QueryUpdater<Task> | undefined

  $: if (!deepEqual(prevQuery, query)) {
    prevQuery = query
    lq = client.query(
      lq,
      task.class.Task,
      query,
      async (result) => {
        data = []
        for (const item of result) {
          data.push(Object.assign(item, { asigneeUser: await getUser(item.assignee) }))
        }
        data = data
        total = result.total
      },
      { limit, skip }
    )
  }

  function onClick (event: any) {
    showPopup(EditTask, { id: event.detail._id }, 'full', () => {
      closePopup()
    })
  }

  async function getUser (user: Ref<Account> | undefined): Promise<Account | undefined> {
    if (user === undefined) return undefined
    return (await client.findAll<Account>(core.class.Account, { _id: user })).pop()
  }
</script>

<LimitHeader bind:skip {total} {limit} />
<Table {data} {columns} on:rowClick={onClick} showHeader />
