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
  import { Progress, UserInfo, ActionIcon, IconMoreV } from '@anticrm/ui'
  import IconChat from '../icons/Chat.svelte'
  import core, { Class, Ref, Account } from '@anticrm/core'
  import { getClient, selectDocument } from '@anticrm/workbench'
  import { QueryUpdater } from '@anticrm/presentation'

  import type { Task } from '@anticrm/task'

  import { getStatusColor } from '../../plugin'

  const client = getClient()

  export let objectId: Ref<Task>
  export let objectClass: Ref<Class<Task>>

  let task: Task | undefined = undefined
  let assignee: Account | undefined = undefined

  let taskUpdater: QueryUpdater<Task> | undefined
  let taskAssignee: QueryUpdater<Account> | undefined

  type ProgressState = { max: number; value: number; color: string }

  $: taskUpdater = client.query(taskUpdater, objectClass, { _id: objectId }, (result) => {
    task = result.shift()
  })

  $: if (task?.assignee !== undefined) {
    taskAssignee = client.query(taskAssignee, core.class.Account, { _id: task.assignee }, (acc) => {
      assignee = acc.shift()
    })
  }

  function calcProgress (task?: Task): ProgressState | undefined {
    if (task === undefined) {
      return
    }
    return {
      max: task.checkItems.length,
      value: task.checkItems.filter((p) => p.done).length,
      color: getStatusColor(task.status)
    }
  }

  let progress: ProgressState | undefined

  $: progress = calcProgress(task)
</script>

{#if task}
  <div class="header">
    <div class="taskWithProgress">
      <div class="taskWithId">
        <span>{task.shortRefId}</span>
        <span>{task.name}</span>
      </div>
      {#if progress && progress.max > 0}
        <div class="progress">
          <Progress {...progress} />
        </div>
      {/if}
    </div>
    <ActionIcon size={24} icon={IconMoreV} direction={'left'} />
  </div>
  <div class="footer">
    <UserInfo user={assignee} />
    <div class="actions">
      <ActionIcon size={24} icon={IconChat} direction={'left'} action={() => selectDocument(task, task?.shortRefId)} />
      <div class="counter">{task.comments.length}</div>
    </div>
  </div>
{/if}

<style lang="scss">
  .header,
  .footer {
    flex-shrink: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .header {
    padding: 0 8px 0 12px;
    height: 64px;
    span {
      margin-right: 16px;
      font-weight: 500;
      color: var(--theme-content-accent-color);
    }
    .taskWithProgress {
      margin-right: 10px;
      flex-grow: 1;
    }
    .taskWithId {
      display: flex;
      flex-direction: row;
    }
    .progress {
      span {
        margin-bottom: 8px;
        font-weight: 500;
        font-size: 10px;
        line-height: 13px;
        letter-spacing: 0.5px;
        text-transform: uppercase;
      }
    }
  }
  .footer {
    padding: 0 24px;
    height: 74px;
    border-top: 1px solid var(--theme-bg-accent-color);
    .actions {
      display: flex;
      flex-direction: row;
      flex-wrap: nowrap;
      align-items: center;

      .counter {
        margin-left: 4px;
        font-weight: 500;
        color: var(--theme-content-color);
      }
    }
  }
</style>
