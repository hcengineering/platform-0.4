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
  import ui, { ActionIcon, Progress, UserInfo } from '@anticrm/ui'
  import MoreH from './icons/MoreH.svelte'
  import Chat from './icons/Chat.svelte'
  import type { Task } from '@anticrm/task'
  import task from '@anticrm/task'
  import { getStatusColor } from '../plugin'
  import core, { Account, Ref } from '@anticrm/core'
  import { getClient } from '@anticrm/workbench'

  export let card: Task

  export const attach: number = 3
  $: progress = {
    max: card.checkItems.length,
    value: card.checkItems.filter((p) => p.done).length,
    color: getStatusColor(card.status)
  }

  const client = getClient()

  async function getUser (assignee: Ref<Account> | undefined): Promise<Account | undefined> {
    if (assignee === undefined) return undefined
    return (await client.findAll(core.class.Account, { _id: assignee })).pop()
  }
</script>

<div class="card-container">
  <div class="content">
    <div class="title">{card.name}</div>
    <div class="description">{card.description}</div>
    {#if progress.max > 0}
      <div class="progress">
        <span>Progress</span>
        <Progress {...progress} />
      </div>
    {/if}
  </div>
  <div class="footer">
    {#await getUser(card.assignee) then user}
      <UserInfo {user} size={24} avatarOnly />
    {/await}
    <div class="action">
      <ActionIcon size={24} icon={Chat} direction={'left'} label={task.string.Comments} />
      <div class="counter">{card.comments.length}</div>
      <ActionIcon size={24} icon={MoreH} direction={'left'} label={ui.string.More} />
    </div>
  </div>
</div>

<style lang="scss">
  .card-container {
    display: flex;
    flex-direction: column;
    background-color: var(--theme-bg-accent-color);
    border: 1px solid var(--theme-bg-accent-color);
    border-radius: 12px;

    .content {
      padding: 40px 20px 28px;
      height: 100%;

      .title {
        font-weight: 500;
        font-size: 14px;
        line-height: 18px;
        color: var(--theme-caption-color);
      }
      .description {
        margin-top: 8px;
        font-size: 12px;
        line-height: 16px;
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
        }
      }
    }

    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 0;
      padding: 20px;
      height: 64px;
      min-height: 64px;
      border-top: 1px solid var(--theme-bg-accent-hover);
      border-radius: 0 0 11px 11px;

      .action {
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        align-items: center;

        .counter {
          margin-left: 4px;
          color: var(--theme-caption-color);
        }
      }
    }

    &:hover {
      background-color: var(--theme-bg-accent-hover);
    }
  }
</style>
