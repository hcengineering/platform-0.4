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
  import type { Ref, Space, DocumentQuery } from '@anticrm/core'
  import type { QueryUpdater } from '@anticrm/presentation'
  import { getClient } from '@anticrm/workbench'
  import { newAllBookmarksQuery } from '../bookmarks'
  import chunter from '../plugin'
  import MessageView from './Message.svelte'
  import SpaceItem from './SpaceItem.svelte'
  import Bookmark from './icons/Bookmark.svelte'

  const client = getClient()

  let bookmarks: MessageBookmark[] = []
  let filter: DocumentQuery<Message> = {}

  $: filter = { _id: { $in: bookmarks.map((m) => m.message) } }

  newAllBookmarksQuery(getClient(), (result) => {
    bookmarks = result.filter((p) => p.channelPin === false)
  })

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

  async function getSpace (_id: Ref<Space>): Promise<Channel> {
    const spaces = await client.findAll<Channel>(chunter.class.Channel, { _id: _id as Ref<Channel> })
    if (spaces.length !== 1) {
      throw new Error('ivalid space found')
    }
    return spaces[0]
  }
</script>

<div class="bookmark-header">
  <div class="title">
    <Bookmark size={26} />
    <span class="title">Add messages and files to come back to later</span>
  </div>
  <span
    >Mark your to-dos or save something for another time. Only you can see your saved items, so use them however you’d
    like.</span
  >
</div>

<div class="threads">
  {#each messages as message}
    <div class="content">
      <div class="flex-col">
        <MessageView {message} thread={false}>
          <svelte:fragment slot="header">
            <div class="header">
              <div class="title">
                {#await getSpace(message.space) then sp}
                  <SpaceItem space={sp} />
                {/await}
              </div>
            </div>
          </svelte:fragment>
        </MessageView>
      </div>
    </div>
  {/each}
</div>

<style lang="scss">
  .bookmark-header {
    margin: 30px;
    .title {
      display: flex;
      align-items: center;
      margin: 10px;
      font-size: 24px;
    }
  }
  .threads {
    overflow: auto;
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      .title {
        flex-grow: 1;
        font-weight: 500;
        font-size: 0.75rem;
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
