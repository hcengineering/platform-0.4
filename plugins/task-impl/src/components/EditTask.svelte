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
  import attachment from '@anticrm/attachment'
  import chunter from '@anticrm/chunter'
  import type { Account, Ref, Space } from '@anticrm/core'
  import core from '@anticrm/core'
  import type { SpaceLastViews } from '@anticrm/notification'
  import { NotificationClient } from '@anticrm/notification'
  import type { QueryUpdater } from '@anticrm/presentation'
  import type { Project, Task } from '@anticrm/task'
  import {
    CheckBoxList,
    Component,
    DatePicker,
    EditBox,
    Icon,
    IconComments,
    Panel,
    Section,
    UserBox
  } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import { afterUpdate, getContext, onDestroy } from 'svelte'
  import { Writable } from 'svelte/store'
  import task from '../plugin'
  import CommentsView from './CommentsView.svelte'
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
        [key]: value === null ? undefined : value
      }
      await client.updateDoc(item._class, item.space, item._id, operations)
      if (spaceLastViews !== undefined) {
        await notificationClient.readNow(spaceLastViews, item._id, true)
      }
    }
  }
</script>

{#if item}
  <Panel on:close>
    <svelte:fragment slot="header">
      <div class="flex-row">
        <div class="title">
          <Icon size={16} icon={task.icon.Task} />
          <span>{item.name}</span>
        </div>
        <div class="description">
          {item.description}
        </div>
      </div>
    </svelte:fragment>
    <svelte:fragment slot="actions">
      <UserBox
        selected={item.assignee}
        users={projectMembers}
        title={task.string.Assignee}
        label={task.string.AssignTask}
        on:change={(e) => {
          update('assignee', e.detail)
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

    <Section label={task.string.Comments} icon={IconComments}>
      <CommentsView currentSpace={item.space} taskId={item._id} />
    </Section>

    <Component
      is={attachment.component.Attachments}
      props={{ objectId: item._id, objectClass: task.class.Task, space: item.space, editable: true }}
    />
  </Panel>
{/if}

<style lang="scss">
  .title {
    display: flex;
    align-items: center;
    font-size: 16px;
    line-height: 24px;
    span {
      margin-left: 10px;
    }
  }
  .description {
    font-size: 12px;
    opacity: 0.4;
  }
</style>
