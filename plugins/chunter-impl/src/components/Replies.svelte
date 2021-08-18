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
  import type { Account, Ref, FindResult } from '@anticrm/core'
  import { getClient } from '@anticrm/workbench'
  import core from '@anticrm/core'
  import chunter from '../plugin'
  import { Label } from '@anticrm/ui'

  const client = getClient()

  export let replies: Ref<Account>[] = []

  const shown: number = 4

  async function getUsers (): Promise<FindResult<Account>> {
    return await client.findAll(core.class.Account, { _id: { $in: replies } }, { limit: shown })
  }
</script>

<div class="replies-container">
  <div class="counter">{replies.length}<Label label={chunter.string.Replies} /></div>
  <div class="replies">
    {#await getUsers() then users}
      {#each users as reply}
        <div class="reply"><img class="circle" src={reply.avatar} alt={reply.name} /></div>
      {/each}
      {#if users.total > shown}
        <div class="reply"><span>+{users.total - shown}</span></div>
      {/if}
    {/await}
  </div>
</div>

<style lang="scss">
  .replies-container {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    user-select: none;

    .counter {
      margin-right: 12px;
      line-height: 150%;
      color: var(--theme-content-color);
      white-space: nowrap;
    }

    .replies {
      display: flex;
      flex-wrap: nowrap;
      align-items: center;

      .reply {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 32px;
        height: 32px;
        background-color: var(--theme-bg-color);
        border-radius: 50%;
        margin-right: -10px;

        .circle {
          width: 28px;
          height: 28px;
          border-radius: 50%;
        }

        span {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 28px;
          height: 28px;
          font-size: 12px;
          font-weight: 500;
          line-height: 0.5;
          color: var(--theme-caption-color);
          background-color: var(--theme-bg-selection);
          border-radius: 50%;
        }

        &:last-child {
          margin-right: 0;
        }
      }
    }
  }
</style>
