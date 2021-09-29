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
  import { Ref, Space } from '@anticrm/core'
  import { getFullRef } from '@anticrm/core'
  import type { QueryUpdater } from '@anticrm/presentation'
  import { IconClose, Label } from '@anticrm/ui'
  import { getClient, selectDocument } from '@anticrm/workbench'
  import type { SpaceNotifications } from '@anticrm/notification'
  import { NotificationClient } from '@anticrm/notification'
  import chunter from '../plugin'
  import ChannelSeparator from './ChannelSeparator.svelte'
  import Comments from './Comments.svelte'
  import MsgView from './Message.svelte'
  import ReferenceInput from './ReferenceInput.svelte'
  import { tick } from 'svelte'

  const client = getClient()
  const notificationClient = new NotificationClient(client)

  export let id: Ref<Message>
  export let notifications: Map<Ref<Space>, SpaceNotifications> = new Map<Ref<Space>, SpaceNotifications>()
  let notification: SpaceNotifications | undefined
  let message: Message | undefined
  let div: HTMLElement
  let messageLastRead = 0

  let lq: QueryUpdater<Message> | undefined

  $: {
    lq = client.query(lq, chunter.class.Message, { _id: id }, async (result) => {
      notification = notifications.get(result[0].space)
      notificationClient.setAutoscroll(div)
      message = result[0]
      messageLastRead = 0
      if (notification?.objectLastReads?.get !== undefined) {
        messageLastRead = notification.objectLastReads.get(message._id) ?? 0
      }
      await tick()
      if (div && notification) {
        notificationClient.before(div, notification, message?._id, true)
      }
      notificationClient.initScroll(div, messageLastRead, true)
    })
  }

  function close () {
    selectDocument(undefined)
  }

  async function addMessage (text: string, notification?: SpaceNotifications): Promise<void> {
    await client.createDoc(chunter.class.Comment, message!.space, {
      replyOf: getFullRef(message!._id, message!._class),
      message: text
    })
    if (notification !== undefined) {
      await notificationClient.readNow(notification, message!._id)
    }
  }

  function scrollHandler () {
    if (message !== undefined) {
      notificationClient.scrollHandler(div, notification, messageLastRead, true, message!._id)
    }
  }
</script>

<div class="header">
  <div class="title"><Label label={chunter.string.Thread} /></div>
  <div class="tool" on:click={close}><IconClose size={16} /></div>
</div>
<div class="content" bind:this={div} on:scroll={scrollHandler}>
  {#if message}
    <div class="flex-col">
      <MsgView {message} notifications={notification} thread />
      <ChannelSeparator label={chunter.string.RepliesText} line />
      <Comments {message} notifications={notification} />
    </div>
  {/if}
</div>
<div class="ref-input">
  <ReferenceInput currentSpace={message?.space} on:message={(event) => addMessage(event.detail, notification)} />
</div>

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
  .ref-input {
    margin: 20px 0 0;
  }
</style>
