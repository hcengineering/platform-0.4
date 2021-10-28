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
  import { createEventDispatcher } from 'svelte'
  import type { Message, MessageBookmark, Channel } from '@anticrm/chunter'
  import type { Ref, Space, DocumentQuery, Account } from '@anticrm/core'
  import core from '@anticrm/core'
  import type { SpaceLastViews } from '@anticrm/notification'
  import type { QueryUpdater } from '@anticrm/presentation'
  import ui, { ActionIcon, Dialog } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import { newAllBookmarksQuery } from '../bookmarks'
  import chunter from '../plugin'
  import MessageView from './Message.svelte'
  import SpaceItem from './SpaceItem.svelte'
  import Pin from './icons/Pin.svelte'

  export let space: Ref<Space> | undefined
  export let spacesLastViews: Map<Ref<Space>, SpaceLastViews> = new Map<Ref<Space>, SpaceLastViews>()

  const client = getClient()
  const dispatch = createEventDispatcher()

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

<Dialog
  label={chunter.string.Pinned}
  okLabel={ui.string.Close}
  withCancel={false}
  okAction={() => {
    dispatch('close')
  }}
  on:close={() => {
    dispatch('close')
  }}
>
  {#each messages as message}
    <MessageView {message} spaceLastViews={spacesLastViews.get(message.space)} thread={false}>
      <svelte:fragment slot="header">
        <div class="header">
          {#await getSpace(message) then sp}
            <SpaceItem space={sp.channel} />
            <div class="flex-row-center">
              pined by <div class="avatar ml-1"><img src={sp.account?.avatar ?? ''} alt={sp.account?.name} /></div>
              {#if bookmarksMap.get(message._id)?.modifiedBy === client.accountId()}
                <div class="ml-2">
                  <ActionIcon
                    icon={Pin}
                    filled
                    size={12}
                    label={chunter.string.ChannelUnPin}
                    action={() => removeBookmark(message)}
                  />
                </div>
              {/if}
            </div>
          {/await}
        </div>
      </svelte:fragment>
    </MessageView>
  {/each}
</Dialog>

<style lang="scss">
  .header {
    display: flex;
    justify-content: space-between;
    flex-wrap: nowrap;
    align-items: center;
    margin-bottom: 0.5rem;
    padding: 0.25rem 0.5rem;
    font-weight: 500;
    font-size: 0.75rem;
    background-color: var(--theme-bg-accent-color);
    border: 1px solid var(--theme-bg-accent-hover);
    border-radius: 0.5rem;

    .avatar {
      min-width: 1rem;
      width: 1rem;
      height: 1rem;
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
