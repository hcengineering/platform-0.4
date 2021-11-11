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
  import type { Message } from '@anticrm/chunter'
  import { generateId, Ref, Space } from '@anticrm/core'
  import { getFullRef } from '@anticrm/core'
  import type { QueryUpdater } from '@anticrm/presentation'
  import { IconClose, Label } from '@anticrm/ui'
  import { getClient, showSideDocument } from '@anticrm/workbench'
  import type { SpaceLastViews } from '@anticrm/notification'
  import { NotificationClient } from '@anticrm/notification'
  import chunter from '../plugin'
  import ChannelSeparator from './ChannelSeparator.svelte'
  import Comments from './Comments.svelte'
  import MsgView from './Message.svelte'
  import ReferenceInput from './ReferenceInput.svelte'
  import { afterUpdate } from 'svelte'
  import { newAllBookmarksQuery } from '../bookmarks'
  import { getContext } from 'svelte'
  import { Writable } from 'svelte/store'

  const spacesLastViews = getContext('spacesLastViews') as Writable<Map<Ref<Space>, SpaceLastViews>>

  const client = getClient()
  const notificationClient = new NotificationClient(client)

  export let id: Ref<Message>
  let spaceLastViews: SpaceLastViews | undefined
  let message: Message | undefined
  let div: HTMLElement
  let messageLastRead = 0
  let commentId = generateId()

  let lq: QueryUpdater<Message> | undefined

  afterUpdate(() => {
    spaceLastViews = message === undefined ? undefined : $spacesLastViews.get(message.space)
  })

  $: {
    lq = client.query(lq, chunter.class.Message, { _id: id }, async (result) => {
      if (result[0] !== undefined) {
        notificationClient.setAutoscroll(div)
      }
      message = result[0]
      messageLastRead = 0
      spaceLastViews = message === undefined ? undefined : $spacesLastViews.get(message.space)
      if (spaceLastViews?.objectLastReads instanceof Map) {
        messageLastRead = spaceLastViews.objectLastReads.get(message?._id) ?? 0
      }
    })
  }

  function close () {
    showSideDocument(undefined)
  }

  async function addMessage (text: string, spaceLastViews?: SpaceLastViews): Promise<void> {
    await client.createDoc(
      chunter.class.Comment,
      message!.space,
      {
        replyOf: getFullRef(message!._id, message!._class),
        message: text
      },
      commentId
    )
    if (spaceLastViews !== undefined) {
      await notificationClient.readNow(spaceLastViews, message!._id, true)
    }
    commentId = generateId()
  }

  function scrollHandler () {
    if (message !== undefined) {
      notificationClient.scrollHandler(div, spaceLastViews, message!._id)
    }
  }

  async function update () {
    if (div && spaceLastViews) {
      await notificationClient.before(div, spaceLastViews, message?._id, true)
    }
    notificationClient.initScroll(div, messageLastRead)
    scrollHandler()
  }

  $: (spaceLastViews?.notificatedObjects?.length ?? 0) > 0 && scrollHandler()

  newAllBookmarksQuery(client, () => {
    // Do nothing just cache
  })
</script>

<div class="header">
  <div class="title"><Label label={chunter.string.Thread} /></div>
  <div class="tool" on:click={close}><IconClose size={16} /></div>
</div>
<div class="content" bind:this={div} on:scroll={scrollHandler}>
  {#if message}
    <div class="flex-col">
      <MsgView {message} thread showReferences={false} showLabels={true} />
      <ChannelSeparator label={chunter.string.RepliesText} line params={{ replies: message.comments?.length }} />
      <Comments
        {message}
        on:update={() => {
          update()
        }}
      />
    </div>
  {/if}
</div>
<div class="ref-input">
  <ReferenceInput
    objectClass={chunter.class.Comment}
    objectId={commentId}
    currentSpace={message?.space}
    on:message={(event) => addMessage(event.detail, spaceLastViews)}
  />
</div>

<style lang="scss">
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .title {
      flex-grow: 1;
      font-weight: 500;
      font-size: 1.25rem;
      color: var(--theme-caption-color);
      user-select: none;
    }
    .tool {
      margin-left: 12px;
      opacity: 0.4;
      cursor: pointer;
      &:hover {
        opacity: 1;
      }
    }
  }
  .content {
    height: calc(100vh - 231px);
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    margin: 10px 10px 0px;
    padding: 10px 10px 0px;
    overflow: auto;
  }
  .ref-input {
    margin: 20px 0 0;
  }
</style>
