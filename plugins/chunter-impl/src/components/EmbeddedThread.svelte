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
  import type { Message, Comment } from '@anticrm/chunter'
  import { generateId, Ref, Space } from '@anticrm/core'
  import { getFullRef } from '@anticrm/core'
  import type { QueryUpdater } from '@anticrm/presentation'
  import { getClient } from '@anticrm/workbench'
  import type { SpaceLastViews } from '@anticrm/notification'
  import { NotificationClient } from '@anticrm/notification'
  import chunter from '../plugin'
  import Comments from './Comments.svelte'
  import MsgView from './Message.svelte'
  import ReferenceInput from './ReferenceInput.svelte'
  import { tick } from 'svelte'
  import { Label } from '@anticrm/ui'

  const client = getClient()
  const notificationClient = new NotificationClient(client)

  export let id: Ref<Message>
  export let spacesLastViews: Map<Ref<Space>, SpaceLastViews> = new Map<Ref<Space>, SpaceLastViews>()
  let spaceLastViews: SpaceLastViews | undefined
  let message: Message | undefined
  let div: HTMLElement
  let messageLastRead = 0
  let showAllReplies = false
  let commentId = generateId()

  let lq: QueryUpdater<Message> | undefined

  $: {
    lq = client.query(lq, chunter.class.Message, { _id: id }, async (result) => {
      if (result[0] !== undefined) {
        spaceLastViews = spacesLastViews.get(result[0].space)
        notificationClient.setAutoscroll(div)
      }
      message = result[0]
      messageLastRead = 0
      if (spaceLastViews?.objectLastReads instanceof Map) {
        messageLastRead = spaceLastViews.objectLastReads.get(message?._id) ?? 0
      }
      await tick()
      if (div && spaceLastViews) {
        await notificationClient.before(div, spaceLastViews, message?._id, true)
      }
      notificationClient.initScroll(div, messageLastRead)
      scrollHandler()
    })
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
    commentId = generateId()
    if (spaceLastViews !== undefined) {
      await notificationClient.readNow(spaceLastViews, message!._id)
    }
  }

  function scrollHandler () {
    if (message !== undefined) {
      notificationClient.scrollHandler(div, spaceLastViews, message!._id)
    }
  }
  function lastMessageIds (message: Message): Ref<Comment>[] {
    if (message.comments !== undefined) {
      const len = message.comments.length
      return message.comments.slice(len - 2, len).map((it) => it._id as Ref<Comment>)
    }
    return []
  }

  $: (spaceLastViews?.notificatedObjects?.length ?? 0) > 0 && scrollHandler()
</script>

<div class="content" bind:this={div} on:scroll={scrollHandler}>
  {#if message}
    <div class="flex-col">
      <MsgView {message} {spaceLastViews} thread showReferences={false} />
      {#if message?.comments && message.comments.length > 2 && !showAllReplies}
        <div
          class="link-text"
          on:click={() => {
            showAllReplies = true
          }}
        >
          <Label label={chunter.string.MoreReplies} params={{ replies: message.comments.length - 2 }} />
        </div>
      {/if}
      <Comments {message} {spaceLastViews} filter={showAllReplies ? {} : { _id: { $in: lastMessageIds(message) } }} />
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
  .content {
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
