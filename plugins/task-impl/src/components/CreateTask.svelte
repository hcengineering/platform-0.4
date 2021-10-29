<!--
// Copyright © 2020 Anticrm Platform Contributors.
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
  import { Card, EditBox, UserBox, Grid } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import type { Task } from '@anticrm/task'
  import { TaskStatuses } from '@anticrm/task'
  import task from '../plugin'
  import core, { generateId } from '@anticrm/core'
  import type { Account, Ref, Space } from '@anticrm/core'
  import type { IntlString } from '@anticrm/status'

  export let space: Space
  let name: string = ''
  let assignee: Ref<Account> | undefined
  const status: IntlString = TaskStatuses.Open
  let dueTo: Date
  const id = generateId() as Ref<Task>

  const client = getClient()

  async function getProjectMembers (): Promise<Array<Account>> {
    const members = space.members
    if (members !== undefined) {
      return await client.findAll(core.class.Account, { _id: { $in: members } })
    } else {
      return []
    }
  }

  async function create () {
    const shortRefId = await client.createShortRef(id, task.class.Task, space._id)

    await client.createDoc(
      task.class.Task,
      space._id,
      {
        name,
        assignee,
        description: '',
        checkItems: [],
        shortRefId,
        dueTo,
        status,
        comments: []
      },
      id
    )
  }
</script>

<Card label={task.string.CreateTask} okAction={create} on:close canSave={!!name}>
  <Grid column={1} rowGap={20}>
    <EditBox label={task.string.TaskName} bind:value={name} />
    {#await getProjectMembers() then users}
      <UserBox
        bind:selected={assignee}
        {users}
        title={task.string.Assignee}
        label={task.string.AssignTask}
        showSearch
      />
    {/await}
  </Grid>
</Card>
