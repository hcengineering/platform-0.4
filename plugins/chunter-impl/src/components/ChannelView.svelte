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
  import { generateId, Ref, Space } from '@anticrm/core'
  import type { Message } from '@anticrm/chunter'
  import type { QueryUpdater } from '@anticrm/presentation'
  import Channel from './Channel.svelte'
  import ReferenceInput from './ReferenceInput.svelte'
  import chunter from '../plugin'
  import { getClient } from '@anticrm/workbench'
  import { tick } from 'svelte'
  import type { SpaceLastViews } from '@anticrm/notification'
  import { NotificationClient } from '@anticrm/notification'
  import PinmarkControl from './PinmarkControl.svelte'
  import { getContext } from 'svelte'
  import { Writable } from 'svelte/store'

  const spacesLastViews = getContext('spacesLastViews') as Writable<Map<Ref<Space>, SpaceLastViews>>

  export let currentSpace: Ref<Space> | undefined
  $: spaceLastViews = currentSpace !== undefined ? $spacesLastViews.get(currentSpace) : undefined
  let id = generateId()

  const client = getClient()
  const notificationClient = new NotificationClient(client)

  let div: HTMLElement

  let messages: Message[] = []

  const loadLimit = 100

  async function addMessage (message: string, spaceLastViews?: SpaceLastViews): Promise<void> {
    await client.createDoc(
      chunter.class.Message,
      currentSpace!,
      {
        message
      },
      id
    )
    if (spaceLastViews !== undefined) {
      await notificationClient.readNow(spaceLastViews, undefined, true)
    }
    id = generateId()
  }

  let query: QueryUpdater<Message> | undefined

  $: if (currentSpace !== undefined) {
    query = client.query(
      query,
      chunter.class.Message,
      { space: currentSpace },
      async (result) => {
        notificationClient.setAutoscroll(div)
        messages = result.reverse() // Since we sort of createOn -1
        await tick()
        if (div !== undefined) {
          if (spaceLastViews) {
            await notificationClient.before(div, spaceLastViews, currentSpace, false)
          }
          notificationClient.initScroll(div, spaceLastViews?.lastRead ?? 0)
          scrollHandler()
        }
      },
      { limit: loadLimit, sort: { createOn: -1 } }
    )
  }

  function scrollHandler () {
    notificationClient.scrollHandler(div, spaceLastViews)
  }

  $: (spaceLastViews?.notificatedObjects?.length ?? 0) > 0 && scrollHandler()
</script>

<PinmarkControl space={currentSpace} />

<div class="msg-board" bind:this={div} on:scroll={scrollHandler}>
  {#if currentSpace}
    <Channel {messages} />
  {/if}
</div>
<div class="ref-input">
  {#if currentSpace}
    <ReferenceInput
      {currentSpace}
      objectClass={chunter.class.Message}
      objectId={id}
      on:message={(event) => addMessage(event.detail, spaceLastViews)}
    />
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
