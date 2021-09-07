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
  import ui, {
    EditBox,
    Dialog,
    UserBox,
    DatePicker,
    Tabs,
    Section,
    IconFile,
    IconComments,
    Grid,
    Row,
    CheckBoxList,
    IconToDo
  } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import type { CheckListItem, Task } from '@anticrm/task'
  import { TaskStatuses } from '@anticrm/task'
  import task from '../plugin'
  import core, { generateId, getFullRef, Timestamp } from '@anticrm/core'
  import type { Account, Ref, Space } from '@anticrm/core'
  import DescriptionEditor from './DescriptionEditor.svelte'
  // import CheckList from './CheckList.svelte'
  import Comments from './Comments.svelte'
  import StatusPicker from './StatusPicker.svelte'
  import { chunterIds as chunter } from '@anticrm/chunter-impl'
  import type { Comment } from '@anticrm/chunter'
  import type { IntlString } from '@anticrm/status'
  import type { SpaceNotifications } from '@anticrm/notification'
  import notification from '@anticrm/notification'

  const dispatch = createEventDispatcher()

  export let space: Space
  let name: string = ''
  let description: string = ''
  let assignee: Ref<Account> | undefined
  let checkItems: CheckListItem[] = []
  let comments: Comment[] = []
  let dueTo: Date
  let status: IntlString = TaskStatuses.Open
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

  function addMessage (message: string): void {
    comments.push({
      message: message,
      modifiedBy: client.accountId(),
      modifiedOn: Date.now(),
      createOn: Date.now(),
      _id: generateId(),
      space: space._id,
      _class: chunter.class.Comment,
      replyOf: getFullRef(id, task.class.Task)
    })
    comments = comments
    updateLastRead()
  }

  async function create () {
    const shortRefId = await client.createShortRef(id, task.class.Task, space._id)

    await client.createDoc(
      task.class.Task,
      space._id,
      {
        name,
        assignee,
        description,
        checkItems,
        shortRefId,
        dueTo,
        status,
        comments: []
      },
      id
    )

    for (const comment of comments) {
      await client.createDoc(chunter.class.Comment, space._id, {
        message: comment.message,
        replyOf: getFullRef(id, task.class.Task)
      })
    }
    updateLastRead()
  }

  async function updateLastRead (): Promise<void> {
    const notifications = (
      await client.findAll(notification.class.SpaceNotifications, {
        objectId: space._id
      })
    ).shift()
    if (notifications === undefined) return
    if (notifications.objectLastReads.set === undefined) {
      notifications.objectLastReads = new Map<Ref<Task>, Timestamp>()
    }
    notifications.objectLastReads.set(id, Date.now())

    await client.updateDoc<SpaceNotifications>(notifications._class, notifications.space, notifications._id, {
      lastRead: Date.now()
    })
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
      <Grid column={2}>
        <EditBox label={task.string.TaskName} bind:value={name} />
        <StatusPicker bind:selected={status} />
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
        <Row>
          <DescriptionEditor
            placeholder={task.string.TaskDescription}
            label={task.string.TaskDescription}
            lines={5}
            bind:value={description}
          />
        </Row>
      </Grid>
    </Section>
    <Section label={task.string.Comments} icon={IconComments}>
      <Grid column={1}>
        <Comments messages={comments} currentSpace={space} on:message={(event) => addMessage(event.detail)} />
      </Grid>
    </Section>
  {:else if selectedTab === task.string.Attachment}
    <Grid column={1} />
  {:else}
    <Section label={task.string.ToDos} icon={IconToDo}>
      <CheckBoxList bind:items={checkItems} label={task.string.AddCheckItem} editable />
    </Section>
  {/if}
</Dialog>
