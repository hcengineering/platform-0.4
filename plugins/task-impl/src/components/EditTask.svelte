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
  import activity from '@anticrm/activity'
  import attachment from '@anticrm/attachment'
  import chunter, { Comment } from '@anticrm/chunter'
  import core, { Account, generateId, getFullRef, Ref, Space } from '@anticrm/core'
  import type { SpaceLastViews } from '@anticrm/notification'
  import { NotificationClient } from '@anticrm/notification'
  import type { QueryUpdater } from '@anticrm/presentation'
  import type { Project, Task } from '@anticrm/task'
  import { ActionIcon, CheckBoxList, Component, DatePicker, EditBox, IconComments, Panel, UserBox } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import { afterUpdate, getContext, onDestroy } from 'svelte'
  import { Writable } from 'svelte/store'
  import task from '../plugin'
  import DescriptionEditor from './DescriptionEditor.svelte'
  import StatusPicker from './StatusPicker.svelte'

  const spacesLastViews = getContext('spacesLastViews') as Writable<Map<Ref<Space>, SpaceLastViews>>
  const client = getClient()
  const notificationClient = new NotificationClient(client)

  export let id: Ref<Task>
  let spaceLastViews: SpaceLastViews | undefined
  let prevId: Ref<Task> | undefined
  let item: Task | undefined
  let projectMembers: Account[] = []
  let desсription: string = ''
  let project: Project | undefined

  $: updateItem(id)

  let lq: QueryUpdater<Task> | undefined

  async function updateItem (id: Ref<Task>) {
    lq = client.query(lq, task.class.Task, { _id: id }, async (result) => {
      spaceLastViews = $spacesLastViews.get(result[0]?.space)
      desсription = result[0]?.description
      item = result[0]
      if (item !== undefined) {
        project = (await client.findAll(core.class.Space, { _id: item.space })).pop()
        const members = project?.members
        if (members !== undefined) {
          projectMembers = await client.findAll(core.class.Account, { _id: { $in: members } })
        } else {
          projectMembers = []
        }
      } else {
        projectMembers = []
      }
    })
  }

  onDestroy(async () => {
    if (spaceLastViews !== undefined) {
      await notificationClient.readNow(spaceLastViews, id)
    }
  })

  afterUpdate(async () => {
    if (prevId !== id) {
      if (prevId !== undefined && spaceLastViews !== undefined) {
        await notificationClient.readNow(spaceLastViews, prevId)
      }
      prevId = id
    }
  })

  async function update (key: string, value: any): Promise<void> {
    if (item !== undefined) {
      const operations = {
        [key]: value === undefined ? null : value
      }
      await client.updateDoc(item._class, item.space, item._id, operations)
      if (spaceLastViews !== undefined) {
        await notificationClient.readNow(spaceLastViews, item._id, true)
      }
    }
  }

  let newCommentId: Ref<Comment> = generateId()

  async function addMessage (task: Task | undefined, evt: any): Promise<void> {
    if (task === undefined) {
      return
    }
    await client.createDoc(
      chunter.class.Comment,
      task.space,
      {
        message: evt.detail as string,
        replyOf: getFullRef(task._id, task._class)
      },
      newCommentId
    )
    newCommentId = generateId()
    const spaceLastViews = $spacesLastViews.get(task.space)
    if (spaceLastViews !== undefined) {
      await notificationClient.readNow(spaceLastViews, task._id, true)
    }
  }
</script>

{#if item}
  <Panel on:close>
    <svelte:fragment slot="header">
      <div class="flex header">
        <ActionIcon circleSize={36} size={16} icon={task.icon.Task} />
        <div class="flex-row header-titles">
          <div class="title">
            {item.name}
          </div>
          <div class="description">
            {#if project}
              {project.description}
            {/if}
          </div>
        </div>
      </div>
    </svelte:fragment>
    <svelte:fragment slot="actions">
      <UserBox
        selected={item.assignee === '' ? undefined : item.assignee}
        users={projectMembers}
        title={task.string.Assignee}
        label={task.string.AssignTask}
        on:change={(e) => {
          update('assignee', e.detail ?? '')
        }}
        showSearch
      />
      <DatePicker
        value={item.dueTo !== undefined ? new Date(item.dueTo) : undefined}
        label={task.string.PickDue}
        noLabel={task.string.NoPickDue}
        on:change={(e) => {
          update('dueTo', e.detail)
        }}
      />
      <StatusPicker
        selected={item.status}
        on:change={(e) => {
          update('status', e.detail)
        }}
      />
    </svelte:fragment>

    <EditBox
      label={task.string.TaskName}
      bind:value={item.name}
      on:blur={(e) => {
        update('name', item?.name)
      }}
    />

    <DescriptionEditor
      currentSpace={item.space}
      label={task.string.TaskDescription}
      placeholder={task.string.TaskDescription}
      on:blur={(e) => {
        if (item?.description !== desсription) {
          update('description', desсription)
        }
      }}
      bind:value={desсription}
    />

    <CheckBoxList
      editable
      label={task.string.ToDos}
      bind:items={item.checkItems}
      on:change={(e) => {
        update('checkItems', item?.checkItems)
      }}
    />

    <Component
      is={chunter.component.References}
      props={{
        label: task.string.References,
        icon: IconComments,
        closed: true,
        docRef: item
      }}
    />

    <Component
      is={attachment.component.Attachments}
      props={{ objectId: item._id, objectClass: task.class.Task, space: item.space, editable: true }}
    />

    <svelte:fragment slot="activity">
      <div class="msg-board">
        <Component is={activity.component.Activity} props={{ spaceId: item.space, doc: item }} />
      </div>
    </svelte:fragment>
    <svelte:fragment slot="ref-input">
      <Component
        is={chunter.component.ReferenceInput}
        props={{ currentSpace: item.space, objectClass: chunter.class.Comment, objectId: newCommentId, thread: true }}
        on:message={(evt) => addMessage(item, evt)}
      />
    </svelte:fragment>
  </Panel>
{/if}

<style lang="scss">
  .header {
    .header-titles {
      margin-left: 10px;
    }
  }
  .title {
    display: flex;
    align-items: center;
    font-size: 16px;
    line-height: 24px;
  }
  .description {
    font-size: 12px;
    opacity: 0.4;
  }
</style>
