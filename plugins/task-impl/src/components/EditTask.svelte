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
  import {
    getCurrentLocation,
    navigate,
    UserBox,
    ScrollBox,
    IconClose,
    DatePicker,
    Tabs,
    Section,
    IconFile,
    IconComments,
    Grid
  } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import type { Task } from '@anticrm/task'
  import task from '../plugin'
  import core from '@anticrm/core'
  import type { Account, Ref } from '@anticrm/core'
  import DescriptionEditor from './DescriptionEditor.svelte'
  import CheckList from './CheckList.svelte'
  import CommentsView from './CommentsView.svelte'
  import type { QueryUpdater } from '@anticrm/presentation'
  import type { IntlString } from '@anticrm/status'

  const client = getClient()

  export let id: Ref<Task>
  let item: Task | undefined
  let projectMembers: Account[] = []

  $: {
    getItem(id)
  }

  let lq: QueryUpdater<Task> | undefined

  async function getItem (id: Ref<Task>) {
    lq = client.query(lq, task.class.Task, { _id: id }, async (result) => {
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

  function close () {
    const loc = getCurrentLocation()
    loc.path.length = 3
    navigate(loc)
  }

  const tabs = [task.string.General, task.string.Attachment, task.string.ToDos]
  let selectedTab: IntlString = task.string.General

  async function update (key: string, value: any): Promise<void> {
    if (item !== undefined) {
      const operations = {
        [key]: value
      }
      client.updateDoc(item._class, item.space, item._id, operations)
    }
  }
</script>

{#await getItem(id) then value}
  {#if item}
    <ScrollBox vertical>
      <div class="header">
        <div class="title">{item.name}</div>
        <div class="tool" on:click={close}><IconClose size={16} /></div>
      </div>
      <Tabs {tabs} bind:selected={selectedTab} />
      {#if selectedTab === task.string.General}
        <Section label={task.string.GeneralInformation} icon={IconFile}>
          <Grid column={1}>
            <DescriptionEditor
              label={task.string.TaskDescription}
              on:blur={(e) => {
                update('description', item?.description)
              }}
              bind:value={item.description}
            />
            <UserBox
              selected={item.assignee}
              users={projectMembers}
              title={task.string.Assignee}
              caption={task.string.ProjectMembers}
              label={task.string.AssignTask}
              on:change={(e) => {
                update('assignee', e.detail)
              }}
              showSearch
            />
            <DatePicker
              selected={item.dueTo}
              title={task.string.PickDue}
              on:change={(e) => {
                update('dueTo', e.detail)
              }}
            />
          </Grid>
        </Section>
        <Section label={task.string.Comments} icon={IconComments}>
          <Grid column={1}>
            <CommentsView currentSpace={item.space} taskId={item._id} />
          </Grid>
        </Section>
      {:else if selectedTab === task.string.Attachment}
      <Grid column={1}></Grid>
      {:else}
        <Section label={task.string.ToDos} icon={IconComments}>
          <Grid column={1}>
            <CheckList
              bind:items={item.checkItems}
              on:change={(e) => {
                update('checkItems', item?.checkItems)
              }}
            />
          </Grid>
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

    .title {
      flex-grow: 1;
      font-weight: 500;
      font-size: 20px;
      line-height: 26px;
      color: var(--theme-caption-color);
      user-select: none;
    }
    .tool {
      width: 16px;
      height: 16px;
      margin-left: 12px;
      opacity: 0.4;
      cursor: pointer;
      &:hover {
        opacity: 1;
      }
    }
  }
</style>
