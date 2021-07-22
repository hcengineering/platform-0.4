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
  import { createEventDispatcher } from 'svelte'
  import { EditBox, Dialog, UserBox, DatePicker } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import { CheckListItem, TaskStatuses } from '@anticrm/task'
  import task from '../plugin'
  import core, { Account, Ref, Space, generateId } from '@anticrm/core'
  import DescriptionEditor from './DescriptionEditor.svelte'
  import CheckList from './CheckList.svelte'

  const dispatch = createEventDispatcher()

  export let space: Ref<Space>
  let name: string = ''
  let description: string = ''
  let assignee: Ref<Account> | undefined
  let checkItems: CheckListItem[] = []

  const client = getClient()

  async function getProjectMembers (): Promise<Array<Account>> {
    const members = (await client.findAll(core.class.Space, { _id: space })).pop()?.members
    if (members !== undefined) {
      return await client.findAll(core.class.Account, { _id: { $in: members } })
    } else {
      return []
    }
  }

  async function create () {
    const id = generateId()
    const shortRefId = await client.createShortRef(id, task.class.Task, space)
    const spaceMembers = (await client.findAll(core.class.Space, { _id: space }))[0].members
    const commentSpace = (
      await client.createDoc(core.class.Space, core.space.Model, {
        name: `${shortRefId} comments`,
        description: `${shortRefId} comments`,
        private: true,
        members: spaceMembers
      })
    )._id

    await client.createDoc(
      task.class.Task,
      space,
      {
        name,
        assignee,
        description,
        checkItems,
        shortRefId,
        commentSpace,
        status: TaskStatuses.Open
      },
      id
    )
  }
</script>

<Dialog
  label={task.string.CreateTask}
  okLabel={task.string.CreateTask}
  okAction={create}
  cancelLabel={task.string.Cancel}
  on:close={() => {
    dispatch('close')
  }}
>
  <div class="content">
    <div class="row"><EditBox label={task.string.TaskName} bind:value={name} /></div>
    <div class="row"><DescriptionEditor label={task.string.TaskDescription} lines={5} bind:value={description} /></div>
    {#await getProjectMembers() then users}
      <div class="row">
        <UserBox
          hAlign={'right'}
          bind:selected={assignee}
          {users}
          caption={task.string.ProjectMembers}
          title={task.string.Assignee}
          label={task.string.AssignTask}
          showSearch
        />
      </div>
    {/await}
    <DatePicker hAlign={'center'} title={'Pick due date'} />
    <div class="row"><CheckList bind:items={checkItems} /></div>
  </div>
</Dialog>

<style lang="scss">
  .content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    row-gap: 20px;

    .row {
      grid-column-start: 1;
      grid-column-end: 3;
    }
  }
</style>
