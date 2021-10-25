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
  import type { Message, MessageBookmark, Channel } from '@anticrm/chunter'
  import type { Ref, Space, DocumentQuery, Account } from '@anticrm/core'
  import core from '@anticrm/core'
  import type { SpaceLastViews } from '@anticrm/notification'
  import type { QueryUpdater } from '@anticrm/presentation'
  import { IconClose, ActionIcon } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import { newAllBookmarksQuery } from '../bookmarks'
  import chunter from '../plugin'
  import MessageView from './Message.svelte'
  import SpaceItem from './SpaceItem.svelte'

  export let space: Ref<Space> | undefined
  export let spacesLastViews: Map<Ref<Space>, SpaceLastViews> = new Map<Ref<Space>, SpaceLastViews>()

  const client = getClient()

  let allBookmarks: MessageBookmark[] = []
  let bookmarks: MessageBookmark[] = []
  let bookmarksMap = new Map<Ref<Message>, MessageBookmark>()
  let filter: DocumentQuery<Message> = {}

  $: filter = { _id: { $in: bookmarks.map((m) => m.message) } }

  newAllBookmarksQuery(getClient(), (result) => {
    allBookmarks = result
  })

  $: bookmarks = bookmarks = allBookmarks.filter((p) => p.channelPin === true && p.space === space)

  let messagesQuery: QueryUpdater<Message> | undefined

  let messages: Message[] = []

  $: messagesQuery = client.query(
    messagesQuery,
    chunter.class.Message,
    filter,
    (result) => {
      messages = result
    },
    {
      sort: { lastModified: -1 }
    }
  )

  $: bookmarksMap = new Map(Array.from(bookmarks.map((b) => [b.message, b])))

  async function getSpace (message: Message): Promise<{ channel: Channel; account: Account }> {
    const spaces = await client.findAll<Channel>(chunter.class.Channel, { _id: message.space as Ref<Channel> })
    if (spaces.length !== 1) {
      throw new Error('ivalid space found')
    }

    const bm = bookmarksMap.get(message._id)
    const account = await client.findAll<Account>(core.class.Account, { _id: bm?.modifiedBy })

    return { channel: spaces[0], account: account[0] }
  }
  function removeBookmark (message: Message): void {
    const bm = bookmarksMap.get(message._id)
    if (bm !== undefined && bm.modifiedBy === client.accountId()) {
      client.removeDoc(bm._class, bm.space, bm._id)
    }
  }
</script>

<div class="threads">
  {#each messages as message}
    <div class="content">
      <div class="flex">
        <MessageView {message} spaceLastViews={spacesLastViews.get(message.space)} thread={false}>
          <svelte:fragment slot="header">
            <div class="header title">
              {#await getSpace(message) then sp}
                <SpaceItem space={sp.channel} />
                <span class="avatar-box">
                  pined by <div class="avatar"><img src={sp.account?.avatar ?? ''} alt={sp.account?.name} /></div>
                </span>
              {/await}
              {#if bookmarksMap.get(message._id)?.modifiedBy === client.accountId()}
                <ActionIcon icon={IconClose} size={16} action={() => removeBookmark(message)} />
              {/if}
            </div>
          </svelte:fragment>
        </MessageView>
      </div>
    </div>
  {/each}
</div>

<style lang="scss">
  .threads {
    display: flex;
    flex-direction: column;
    width: 500px;
    max-height: 800px;
    padding: 16px;
    height: min-content;
    background-color: var(--theme-popup-bg);
    border: var(--theme-popup-border);
    border-radius: 20px;
    box-shadow: var(--theme-popup-shadow);
    -webkit-backdrop-filter: blur(30px);
    backdrop-filter: blur(30px);
    overflow: auto;

    .header {
      display: flex;
      justify-content: space-between;
      flex-wrap: nowrap;
      align-items: center;
      margin-bottom: 20px;

      .title {
        flex-grow: 1;
        font-weight: 500;
        font-size: 0.75rem;
        color: var(--theme-caption-color);
        user-select: none;
      }
      .avatar-box {
        display: flex;
        margin-left: 10px;
      }
    }

    .content {
      width: 444px;
      border-radius: 12px;
      background-color: var(--theme-bg-low-accent-color);
    }

    .avatar {
      min-width: 16px;
      width: 16px;
      height: 16px;
      background-color: var(--theme-bg-accent-color);
      border-radius: 50%;
      user-select: none;
      overflow: hidden;
      img {
        max-width: 100%;
        max-height: 100%;
      }
    }
  }
</style>
