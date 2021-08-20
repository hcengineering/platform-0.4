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
  import type { Channel } from '@anticrm/chunter'

  import type { Account, Ref } from '@anticrm/core'
  import core from '@anticrm/core'

  import { QueryUpdater } from '@anticrm/presentation'

  import { getClient } from '@anticrm/workbench'

  export let space: Channel | undefined
  export let headerSize = false
  $: size = headerSize ? 36 : 24

  const client = getClient()

  let members: Ref<Account>[] = []
  let accounts: Account[] = []

  $: if (space) {
    members = space.members.filter((a) => a !== client.accountId())
  }

  let memberQuery: QueryUpdater<Account> | undefined

  $: if (space) {
    memberQuery = client.query<Account>(memberQuery, core.class.Account, { _id: { $in: members } }, (result) => {
      accounts = result
    })
  }

  let user: Account | undefined
  $: user = accounts[0]
</script>

<div class="user-container">
  {#if user}
    <div style="width: {size}px; height: {size}px;">
      <img class="img" style="width: {size}px; height: {size}px;" src={user.avatar} alt={'avatar'} />
    </div>
    <div class="caption">
      <div class="title" class:header={headerSize} class:item={!headerSize}>
        {accounts
          .map((u) => u.name)
          .slice(0, 2)
          .join(', ') + (accounts.length > 2 ? ` and ${accounts.length - 2} more.` : '')}
      </div>
    </div>
  {/if}
</div>

<style lang="scss">
  .user-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    flex-wrap: nowrap;

    .img {
      border-radius: 50%;
      overflow: hidden;
    }

    .caption {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      margin-left: 8px;
      color: var(--theme-caption-color);

      .title {
        max-width: 300px;
        text-align: left;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;

        .header {
          font-weight: 700;
        }
        .item {
          font-weight: 500;
        }
      }
    }
  }
</style>
