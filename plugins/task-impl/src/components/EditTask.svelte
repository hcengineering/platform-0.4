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
  import { getCurrentLocation, Label, Progress, navigate, UserBox } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import { CheckListItem, Task } from '@anticrm/task'
  import task from '../plugin'
  import { Ref } from '@anticrm/core'
  import DescriptionEditor from './DescriptionEditor.svelte'
  import Close from '@anticrm/ui/src/components/internal/icons/Close.svelte'
  import TaskStatus from './TaskStatus.svelte'
  import { onDestroy } from 'svelte'
  import ChannelView from '@anticrm/chunter-impl/src/components/ChannelView.svelte'
  import CheckList from './CheckList.svelte'
  import ScrollBox from '@anticrm/ui/src/components/ScrollBox.svelte'

  const client = getClient()

  export let id: Ref<Task>
  let item: Task | undefined
  let description: string | undefined
  let checkItems: CheckListItem[] = []

  $: progress = {
    max: checkItems.length,
    value: checkItems.filter((p) => p.done).length
  }

  $: {
    getItem(id)
  }

  let unsubscribe = () => {}

  async function getItem (id: Ref<Task>) {
    unsubscribe()
    unsubscribe = client.query(task.class.Task, { _id: id }, (result) => {
      item = result[0]
      description = item.description
      checkItems = item.checkItems
    })
    return item
  }

  onDestroy(() => {
    unsubscribe()
  })

  function close () {
    const loc = getCurrentLocation()
    loc.path.length = 3
    navigate(loc)
  }

  async function updateCheckItem () {
    if (item === undefined) return
    await client.updateDoc(item._class, item.space, item._id, {
      checkItems: checkItems
    })
  }

  async function updateDescription () {
    if (item === undefined) return
    if (item.description !== description) {
      await client.updateDoc(item._class, item.space, item._id, {
        description: description
      })
    }
  }
</script>

{#await getItem(id) then value}
  {#if item}
    <ScrollBox vertical>
      <div class="header">
        <div class="title"><TaskStatus title={item.status} /></div>
        <div class="tool" on:click={close}><Close size={16} /></div>
      </div>
      <div class="content">
        <div class="row">{item.name}</div>
        <div class="row">
          <DescriptionEditor label={task.string.TaskDescription} on:blur={updateDescription} bind:value={description} />
        </div>
        <div class="row">
          <UserBox hAlign={'right'} title={task.string.Assignee} label={task.string.AssignTask} showSearch />
        </div>
        {#if progress.max > 0}
          <div class="row progress">
            <Label label={task.string.Progress} />
            <span>{((progress.value * 100) / progress.max).toFixed(0)}%</span>
            <Progress {...progress} />
          </div>
        {/if}
        <CheckList bind:items={checkItems} on:change={updateCheckItem} />
        <ChannelView currentSpace={item.commentSpace} />
      </div>
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

  .content {
    height: calc(100vh - 204px);

    .row {
      margin-top: 10px;
    }

    .progress {
      margin-top: 24px;
      span {
        margin-bottom: 8px;
        font-weight: 500;
        font-size: 10px;
        line-height: 13px;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        text-align: right;
      }
    }
  }
</style>