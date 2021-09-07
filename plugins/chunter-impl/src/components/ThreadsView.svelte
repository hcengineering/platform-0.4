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
  import { Ref, Timestamp } from '@anticrm/core'
  import { getFullRef } from '@anticrm/core'
  import type { QueryUpdater } from '@anticrm/presentation'
  import { IconClose, Label } from '@anticrm/ui'
  import { getRouter } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import type { WorkbenchRoute } from '@anticrm/workbench'
  import type { SpaceNotifications } from '@anticrm/notification'
  import chunter from '../plugin'
  import ChannelSeparator from './ChannelSeparator.svelte'
  import Comments from './Comments.svelte'
  import MsgView from './Message.svelte'
  import ReferenceInput from './ReferenceInput.svelte'
  import { afterUpdate, beforeUpdate } from 'svelte'

  const client = getClient()
  const router = getRouter<WorkbenchRoute>()

  export let id: Ref<Message>
  export let notifications: SpaceNotifications | undefined
  let message: Message | undefined
  let prevMessage: Message | undefined
  let div: HTMLElement
  let autoscroll: boolean = false
  let lastPosition = 0
  let lastTime = 0
  let waitingUpdate = false
  let messageLastRead = 0

  let lq: QueryUpdater<Message> | undefined

  $: {
    lq = client.query(lq, chunter.class.Message, { _id: id }, async (result) => {
      message = result[0]
      autoscroll = lastPosition > 0 ? lastPosition > div.scrollHeight - div.clientHeight - 30 : false
      messageLastRead = 0
      if (notifications?.objectLastReads?.get !== undefined) {
        messageLastRead = notifications.objectLastReads.get(message._id) ?? 0
      }
    })
  }

  function close () {
    router.navigate({
      itemId: undefined
    })
  }

  async function addMessage (text: string): Promise<void> {
    await client.createDoc(chunter.class.Comment, message!.space, {
      replyOf: getFullRef(message!._id, message!._class),
      message: text
    })
    lastTime = Date.now()
    await updateLastRead(message!)
  }

  beforeUpdate(async () => {
    if (message?._id !== prevMessage?._id) {
      if (waitingUpdate && prevMessage !== undefined) await updateLastRead(prevMessage)
      prevMessage = message
      lastPosition = 0
      lastTime = 0
      autoscroll = false
    } else if (div) {
      lastPosition = div.scrollTop
    }
  })

  function scroll () {
    if (div) {
      if (autoscroll) {
        div.scrollTo(0, div.scrollHeight)
        return
      }
      if (lastPosition > 0) {
        div.scrollTo(0, lastPosition)
        return
      }
      if (messageLastRead > 0) {
        const messages = div.getElementsByClassName('message')
        let olderNewMessage: HTMLElement | undefined
        for (let i = messages.length; i >= 1; i--) {
          const elem = messages[i] as HTMLElement
          if (elem === undefined) continue
          const modified = elem.dataset.modified
          if (modified !== undefined && parseInt(modified) > messageLastRead) olderNewMessage = elem
        }
        if (olderNewMessage !== undefined) {
          olderNewMessage.scrollIntoView(false)
          return
        }
      }
      div.scrollTo(0, div.scrollHeight)
    }
  }

  afterUpdate(() => {
    scroll()
    scrollHandler()
  })

  function scrollHandler () {
    lastPosition = div.scrollTop
    const messages = div.getElementsByClassName('message')
    const divBottom = div.getBoundingClientRect().bottom
    for (let i = 1; i < messages.length; i++) {
      const elem = messages[i] as HTMLElement
      if (elem.getBoundingClientRect().bottom > divBottom) break
      const modified = elem.dataset.modified
      if (modified === undefined) continue
      const messageModified = parseInt(modified)
      lastTime = messageModified > lastTime ? messageModified : lastTime
    }
    if (lastTime > messageLastRead) {
      if (!waitingUpdate) {
        waitingUpdate = true
        setTimeout(updateLastRead, 3000, message)
      }
    }
  }

  async function updateLastRead (message: Message) {
    if (notifications === undefined) return
    if (notifications.objectLastReads.set === undefined) {
      notifications.objectLastReads = new Map<Ref<Message>, Timestamp>()
    }
    notifications.objectLastReads.set(message._id, lastTime)
    client.updateDoc(notifications._class, notifications.space, notifications._id, {
      objectLastReads: notifications.objectLastReads
    })
    waitingUpdate = false
  }
</script>

<div class="header">
  <div class="title"><Label label={chunter.string.Thread} /></div>
  <div class="tool" on:click={close}><IconClose size={16} /></div>
</div>
<div class="content" bind:this={div} on:scroll={scrollHandler}>
  {#if message}
    <div class="flex-col">
      <MsgView {message} {notifications} thread />
      <ChannelSeparator label={chunter.string.RepliesText} line />
      <Comments {message} {notifications} />
    </div>
  {/if}
</div>
<ReferenceInput on:message={(event) => addMessage(event.detail)} />

<style lang="scss">
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

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
</style>
