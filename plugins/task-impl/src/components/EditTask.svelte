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
  import core, { Account, Ref, Space } from '@anticrm/core'
  import type { SpaceNotifications } from '@anticrm/notification'
  import { NotificationClient } from '@anticrm/notification'
  import type { QueryUpdater } from '@anticrm/presentation'
  import type { IntlString } from '@anticrm/status'
  import type { Task } from '@anticrm/task'
  import {
    CheckBoxList,
    DatePicker,
    EditBox,
    Grid,
    IconClose,
    IconComments,
    IconFile,
    IconToDo,
    Row,
    ScrollBox,
    Section,
    Tabs,
    UserBox
  } from '@anticrm/ui'
  import { getClient, selectDocument } from '@anticrm/workbench'
  import { afterUpdate, onDestroy } from 'svelte'
  import task from '../plugin'
  import DescriptionEditor from './DescriptionEditor.svelte'
  import CommentsView from './CommentsView.svelte'
  import StatusPicker from './StatusPicker.svelte'
  import attachment from '@anticrm/attachment'
  import { Attachments } from '@anticrm/attachment-impl'

  const client = getClient()
  const notificationClient = new NotificationClient(client)

  export let id: Ref<Task>
  export let notifications: Map<Ref<Space>, SpaceNotifications> = new Map<Ref<Space>, SpaceNotifications>()
  let notification: SpaceNotifications | undefined
  let prevId: Ref<Task> | undefined
  let item: Task | undefined
  let projectMembers: Account[] = []
  let desсription: string = ''

  $: {
    getItem(id)
  }

  let lq: QueryUpdater<Task> | undefined

  async function getItem (id: Ref<Task>) {
    lq = client.query(lq, task.class.Task, { _id: id }, async (result) => {
      notification = notifications.get(result[0].space)
      desсription = result[0].description
      item = result[0]
      const members = (await client.findAll(core.class.Space, { _id: item.space })).pop()?.members
      if (members !== undefined) {
        projectMembers = await client.findAll(core.class.Account, { _id: { $in: members } })
      } else {
        projectMembers = []
      }
    })
    return item
  }

  onDestroy(async () => {
    if (notification !== undefined) {
      notificationClient.readNow(notification, id)
    }
  })

  afterUpdate(async () => {
    if (prevId !== id) {
      if (prevId !== undefined && notification !== undefined) {
        notificationClient.readNow(notification, prevId)
      }
      prevId = id
    }
  })

  function close () {
    selectDocument()
  }

  const tabs = [task.string.General, attachment.string.Attachments, task.string.ToDos]
  let selectedTab: IntlString = task.string.General

  async function update (key: string, value: any): Promise<void> {
    if (item !== undefined) {
      const operations = {
        [key]: value === null ? undefined : value
      }
      client.updateDoc(item._class, item.space, item._id, operations)
    }
  }
</script>

{#await getItem(id) then value}
  {#if item}
    <div class="header">
      <div class="title">{item.name}</div>
      <div class="tool" on:click={close}><IconClose size={16} /></div>
    </div>
    <ScrollBox autoscrollable={true} vertical>
      <Tabs {tabs} bind:selected={selectedTab} />
      {#if selectedTab === task.string.General}
        <Section label={task.string.GeneralInformation} icon={IconFile}>
          <Grid column={2}>
            <EditBox
              label={task.string.TaskName}
              bind:value={item.name}
              on:blur={(e) => {
                update('name', item?.name)
              }}
            />
            <StatusPicker
              selected={item.status}
              on:change={(e) => {
                update('status', e.detail)
              }}
            />
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
              value={new Date(item.dueTo)}
              label={task.string.PickDue}
              on:change={(e) => {
                update('dueTo', e.detail)
              }}
            />
            <Row>
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
            </Row>
          </Grid>
        </Section>
        <Section label={task.string.Comments} icon={IconComments}>
          <CommentsView notifications={notification} currentSpace={item.space} taskId={item._id} />
        </Section>
      {:else if selectedTab === attachment.string.Attachments}
        <Section label={attachment.string.Attachments} icon={IconFile}>
          <Attachments objectId={item._id} space={item.space} editable />
        </Section>
      {:else}
        <Section label={task.string.ToDos} icon={IconToDo}>
          <CheckBoxList
            editable
            label={task.string.AddCheckItem}
            bind:items={item.checkItems}
            on:change={(e) => {
              update('checkItems', item?.checkItems)
            }}
          />
        </Section>
      {/if}
    </ScrollBox>
  {/if}
{/await}

<style lang="scss">
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .title {
      flex-grow: 1;
      font-weight: 500;
      font-size: 1.25rem;
      color: var(--theme-caption-color);
      user-select: none;
    }
    .tool {
      margin-left: 12px;
      opacity: 0.4;
      cursor: pointer;
      &:hover {
        opacity: 1;
      }
    }
  }
</style>
