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
  import { CheckBoxList, UserInfo, ActionIcon, IconMoreV } from '@anticrm/ui'
  import IconChat from '../icons/Chat.svelte'
  import core, { Class, Ref, Account } from '@anticrm/core'
  import { getClient } from '@anticrm/workbench'
  import { QueryUpdater } from '@anticrm/presentation'

  import { Task } from '@anticrm/task'
  import taskIds from '../../plugin'

  const client = getClient()

  export let objectId: Ref<Task>
  export let objectClass: Ref<Class<Task>>

  let task: Task | undefined = undefined
  let assignee: Account | undefined = undefined

  let taskUpdater: QueryUpdater<Task> | undefined
  let taskAssignee: QueryUpdater<Account> | undefined

  $: taskUpdater = client.query(taskUpdater, objectClass, { _id: objectId }, (result) => {
    task = result.shift()
  })

  $: if (task?.assignee !== undefined) {
    taskAssignee = client.query(taskAssignee, core.class.Account, { _id: task.assignee }, (acc) => {
      assignee = acc.shift()
    })
  }
</script>

{#if task}
  <div class="header">
    <div class="taskWithId">
      <span>{task.shortRefId}</span>
      <span>{task.name}</span>
    </div>
    <ActionIcon size={24} icon={IconMoreV} direction={'left'} />
  </div>
  <div class="checklist">
    <CheckBoxList label={taskIds.string.AddCheckItem} bind:items={task.checkItems} />
  </div>
  <div class="footer">
    <UserInfo user={assignee} />
    <div class="actions">
      <ActionIcon size={24} icon={IconChat} direction={'left'} />
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
    padding: 0 16px 0 24px;
    height: 84px;
    span {
      margin-right: 16px;
      font-weight: 500;
      color: var(--theme-content-accent-color);
    }
    .taskWithId {
      display: flex;
      flex-direction: column;
    }
  }
  .checklist {
    padding: 2px 24px 24px;
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
