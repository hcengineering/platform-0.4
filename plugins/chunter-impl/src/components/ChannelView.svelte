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
  import type { Ref, Space } from '@anticrm/core'
  import type { Message } from '@anticrm/chunter'
  import type { QueryUpdater } from '@anticrm/presentation'
  import Channel from './Channel.svelte'
  import ReferenceInput from './ReferenceInput.svelte'
  import chunter from '../plugin'
  import { getClient } from '@anticrm/workbench'
  import { afterUpdate, beforeUpdate } from 'svelte'
  import type { SpaceNotifications } from '@anticrm/notification'
  import { NotificationClient } from '@anticrm/notification'

  export let currentSpace: Ref<Space> | undefined
  export let notifications: SpaceNotifications | undefined

  const client = getClient()
  const notificationClient = new NotificationClient(client)

  let div: HTMLElement

  let messages: Message[] = []

  async function addMessage (message: string): Promise<void> {
    await client.createDoc(chunter.class.Message, currentSpace!, {
      message
    })
    if (notifications !== undefined) {
      await notificationClient.readNow(notifications)
    }
  }

  let query: QueryUpdater<Message> | undefined

  $: if (currentSpace !== undefined) {
    query = client.query(query, chunter.class.Message, { space: currentSpace }, (result) => {
      messages = result
      notificationClient.setAutoscroll(div)
    })
  }

  beforeUpdate(async () => {
    if (div && notifications) {
      notificationClient.before(div, notifications, currentSpace, false)
    }
  })

  afterUpdate(() => {
    notificationClient.initScroll(div, notifications?.lastRead ?? 0, false)
    scrollHandler()
  })

  function scrollHandler () {
    notificationClient.scrollHandler(div, notifications, notifications?.lastRead ?? 0, false)
  }
</script>

<div class="msg-board" bind:this={div} on:scroll={scrollHandler}>
  {#if currentSpace}
    <Channel {messages} {notifications} />
  {/if}
</div>
<div class="ref-input">
  {#if currentSpace}
    <ReferenceInput on:message={(event) => addMessage(event.detail)} />
  {/if}
</div>

<style lang="scss">
  .msg-board {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    margin: 10px 10px 0px;
    padding: 10px 10px 0px;
    overflow: auto;
  }
  .ref-input {
    margin: 20px 40px;
  }
</style>
