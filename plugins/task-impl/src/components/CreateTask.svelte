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
  import ui, { EditBox, Dialog, UserBox, DatePicker, Tabs, Section, IconFile, IconComments, Grid, Row, CheckBoxList, IconToDo } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import type { CheckListItem, Task } from '@anticrm/task'
  import { TaskStatuses } from '@anticrm/task'
  import task from '../plugin'
  import core, { generateId, getFullRef } from '@anticrm/core'
  import type { Account, Ref, Space, Timestamp } from '@anticrm/core'
  import DescriptionEditor from './DescriptionEditor.svelte'
  // import CheckList from './CheckList.svelte'
  import Comments from './Comments.svelte'
  import { chunterIds as chunter } from '@anticrm/chunter-impl'
  import type { Comment } from '@anticrm/chunter'
  import type { IntlString } from '@anticrm/status'

  const dispatch = createEventDispatcher()

  export let space: Ref<Space>
  let name: string = ''
  let description: string = ''
  let assignee: Ref<Account> | undefined
  let checkItems: CheckListItem[] = []
  let comments: Message[] = []
  let dueTo: Date
  const id = generateId() as Ref<Task>

  const client = getClient()

  async function getProjectMembers (): Promise<Array<Account>> {
    const members = (await client.findAll(core.class.Space, { _id: space })).pop()?.members
    if (members !== undefined) {
      return await client.findAll(core.class.Account, { _id: { $in: members } })
    } else {
      return []
    }
  }

  interface Message {
    _id: Ref<Comment>
    message: string
    modifiedOn: Timestamp
    createOn: Timestamp
    modifiedBy: Ref<Account>
  }

  function addMessage (message: string): void {
    comments.push({
      message: message,
      modifiedBy: client.accountId(),
      modifiedOn: Date.now(),
      createOn: Date.now(),
      _id: generateId()
    })
    comments = comments
  }

  async function create () {
    const shortRefId = await client.createShortRef(id, task.class.Task, space)

    await client.createDoc(
      task.class.Task,
      space,
      {
        name,
        assignee,
        description,
        checkItems,
        shortRefId,
        dueTo,
        status: TaskStatuses.Open,
        comments: []
      },
      id
    )

    for (const comment of comments) {
      await client.createDoc(chunter.class.Comment, space, {
        message: comment.message,
        replyOf: getFullRef(id, task.class.Task)
      })
    }
  }

  const tabs = [task.string.General, task.string.Attachment, task.string.ToDos]
  let selectedTab: IntlString = task.string.General
</script>

<Dialog
  label={task.string.CreateTask}
  okLabel={task.string.CreateTask}
  okAction={create}
  cancelLabel={ui.string.Cancel}
  on:close={() => {
    dispatch('close')
  }}
>
  <Tabs {tabs} bind:selected={selectedTab} />
  {#if selectedTab === task.string.General}
    <Section label={task.string.GeneralInformation} icon={IconFile}>
      <Grid>
        <Row><EditBox label={task.string.TaskName} bind:value={name} /></Row>
        {#await getProjectMembers() then users}
          <UserBox
            bind:selected={assignee}
            {users}
            caption={task.string.ProjectMembers}
            title={task.string.Assignee}
            label={task.string.AssignTask}
            showSearch
          />
        {/await}
        <DatePicker bind:selected={dueTo} title={task.string.PickDue} />
        <Row><DescriptionEditor label={task.string.TaskDescription} lines={5} bind:value={description} /></Row>
      </Grid>
    </Section>
    <Section label={task.string.Comments} icon={IconComments}>
      <Grid column={1}>
        <Comments messages={comments} on:message={(event) => addMessage(event.detail)} />
      </Grid>
    </Section>
  {:else if selectedTab === task.string.Attachment}
    <Grid column={1} />
  {:else}
    <Section label={task.string.ToDos} icon={IconToDo}>
        <!-- <CheckList bind:items={checkItems} /> -->
        <CheckBoxList bind:items={checkItems} label={'Add a To Do'} editable />
    </Section>
  {/if}
</Dialog>
