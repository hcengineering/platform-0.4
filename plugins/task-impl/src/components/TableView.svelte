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
  import { Table, Label, UserInfo, DateTime } from '@anticrm/ui'
  import core, { DocumentQuery } from '@anticrm/core'
  import type { Ref, Doc, Account } from '@anticrm/core'
  import { getClient, selectDocument } from '@anticrm/workbench'

  import { deepEqual } from 'fast-equals'
  import TaskStatus from './TaskStatus.svelte'

  import type { QueryUpdater } from '@anticrm/presentation'
  import type { Task } from '@anticrm/task'
  import task from '@anticrm/task'

  export let query: DocumentQuery<Task>
  let prevQuery: DocumentQuery<Task> | undefined

  const columns = [
    { label: task.string.TaskName, properties: [{ key: 'name', property: 'label' }], component: Label },
    {
      label: task.string.Status,
      properties: [{ key: 'status', property: 'title' }],
      component: TaskStatus
    },
    { label: task.string.Assignee, properties: [{ key: 'asigneeUser', property: 'user' }], component: UserInfo },
    {
      label: task.string.Due,
      properties: [
        { key: 'dueTo', property: 'value' },
        { value: 'true', property: 'dateOnly' }
      ],
      component: DateTime
    }
  ]

  const client = getClient()
  let data: Doc[] = []

  let lq: QueryUpdater<Task> | undefined

  $: if (!deepEqual(prevQuery, query)) {
    prevQuery = query
    lq = client.query(lq, task.class.Task, query, async (result) => {
      data = []
      for (const item of result) {
        data.push(Object.assign(item, { asigneeUser: await getUser(item.assignee) }))
      }
      data = data
    })
  }

  function onClick (event: any) {
    selectDocument(event.detail)
  }

  async function getUser (user: Ref<Account> | undefined): Promise<Account | undefined> {
    if (user === undefined) return undefined
    return (await client.findAll<Account>(core.class.Account, { _id: user })).pop()
  }
</script>

<Table {data} {columns} on:rowClick={onClick} showHeader />
