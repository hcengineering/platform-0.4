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
  import type { Ref, Space } from '@anticrm/core'
  import type { Message, Channel } from '@anticrm/chunter'
  import { getClient } from '@anticrm/workbench'
  import chunter from '../plugin'
  import EmbeddedThread from './EmbeddedThread.svelte'
  import SpaceItem from './SpaceItem.svelte'
  import type { SpaceNotifications } from '@anticrm/notification'

  export let notifications: Map<Ref<Space>, SpaceNotifications> = new Map<Ref<Space>, SpaceNotifications>()

  const client = getClient()

  let messages: Message[] = []

  $: {
    client
      .findAll(
        chunter.class.Message,
        { 'comments.userId': client.accountId() },
        {
          sort: { lastModified: -1 }
        }
      )
      .then((result) => {
        messages = result
      })
  }
  async function getSpace (_id: Ref<Space>): Promise<Channel> {
    const spaces = await client.findAll<Channel>(chunter.class.Channel, { _id: _id as Ref<Channel> })
    if (spaces.length !== 1) {
      throw new Error('ivalid space found')
    }
    return spaces[0]
  }
</script>

<div class="threads">
  {#each messages as message}
    <div class="content">
      <div class="header">
        <div class="title">
          {#await getSpace(message.space) then sp}
            <SpaceItem space={sp} />
          {/await}
        </div>
      </div>
      <div class="flex-col">
        <EmbeddedThread id={message._id} {notifications} />
      </div>
    </div>
  {/each}
</div>

<style lang="scss">
  .threads {
    overflow: auto;
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 20px;

      .title {
        flex-grow: 1;
        font-weight: 500;
        font-size: 1.25rem;
        color: var(--theme-caption-color);
        user-select: none;
      }
    }
    .content {
      margin: 20px;
      margin-top: 40px;
      padding: 10px;
      border-radius: 12px;
      background-color: var(--theme-bg-low-accent-color);
    }
  }
</style>
