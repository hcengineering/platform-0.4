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
  import { Ref } from '@anticrm/core'
  import { getFullRef } from '@anticrm/core'
  import type { QueryUpdater } from '@anticrm/presentation'
  import { IconClose, Label } from '@anticrm/ui'
  import { getRouter } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import type { WorkbenchRoute } from '@anticrm/workbench'
  import type { SpaceNotifications } from '@anticrm/notification'
  import { NotificationClient } from '@anticrm/notification'
  import chunter from '../plugin'
  import ChannelSeparator from './ChannelSeparator.svelte'
  import Comments from './Comments.svelte'
  import MsgView from './Message.svelte'
  import ReferenceInput from './ReferenceInput.svelte'
  import { afterUpdate, beforeUpdate } from 'svelte'

  const client = getClient()
  const router = getRouter<WorkbenchRoute>()
  const notificationClient = new NotificationClient(client)

  export let id: Ref<Message>
  export let notifications: SpaceNotifications | undefined
  let message: Message | undefined
  let div: HTMLElement
  let messageLastRead = 0

  let lq: QueryUpdater<Message> | undefined

  $: {
    lq = client.query(lq, chunter.class.Message, { _id: id }, async (result) => {
      message = result[0]
      notificationClient.setAutoscroll(div)
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
    if (notifications !== undefined) {
      await notificationClient.readNow(notifications, message!._id)
    }
  }

  beforeUpdate(async () => {
    if (div && notifications) {
      notificationClient.before(div, notifications, message?._id, true)
    }
  })

  afterUpdate(() => {
    notificationClient.initScroll(div, messageLastRead, true)
    scrollHandler()
  })

  function scrollHandler () {
    if (message !== undefined) {
      notificationClient.scrollHandler(div, notifications, messageLastRead, true, message!._id)
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
      <MsgView {message} {notifications} thread />
      <ChannelSeparator label={chunter.string.RepliesText} line />
      <Comments {message} {notifications} />
    </div>
  {/if}
</div>
<div class="ref-input">
  <ReferenceInput on:message={(event) => addMessage(event.detail)} />
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
