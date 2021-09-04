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
  import type { Space } from '@anticrm/core'
  import type { Message } from '@anticrm/chunter'
  import type { QueryUpdater } from '@anticrm/presentation'
  import Channel from './Channel.svelte'
  import ReferenceInput from './ReferenceInput.svelte'
  import chunter from '../plugin'
  import { getClient } from '@anticrm/workbench'
  import { afterUpdate, beforeUpdate } from 'svelte'

  export let currentSpace: Space | undefined
  let prevSpace: Space | undefined

  const client = getClient()
  let div: HTMLElement
  let autoscroll: boolean = false

  let messages: Message[] = []

  async function addMessage (message: string): Promise<void> {
    await client.createDoc(chunter.class.Message, currentSpace!._id, {
      message
    })
    lastTime = Date.now()
    await updateLastRead(currentSpace!)
  }

  let query: QueryUpdater<Message> | undefined
  let lastPosition = 0
  let lastTime = 0
  let waitingUpdate = false

  $: if (currentSpace !== undefined) {
    query = client.query(query, chunter.class.Message, { space: currentSpace._id }, (result) => {
      messages = result
      autoscroll = lastPosition > 0 ? (lastPosition > div.scrollHeight - div.clientHeight - 30) : false
    })
  }

  beforeUpdate(async () => {
    if (currentSpace?._id !== prevSpace?._id) {
      if (waitingUpdate && prevSpace !== undefined) await updateLastRead(prevSpace)
      prevSpace = currentSpace
      lastPosition = 0
      lastTime = 0
      autoscroll = false
    } else if (div) {
      lastPosition = div.scrollTop
    }
  })

  function scroll() {
    if (autoscroll) {
      div.scrollTo(0, div.scrollHeight)
      return
    }
    if (lastPosition > 0) {
      div.scrollTo(0, lastPosition)
      return
    }
    if (currentSpace?.account?.lastRead !== undefined) {
      const messages = div.getElementsByClassName('message')
      let olderNewMessage: HTMLElement | undefined
      for (let i = messages.length; i >= 0; i--) {
        const elem = messages[i] as HTMLElement
        if (elem === undefined) continue
        const modified = elem.dataset.modified
        if (modified !== undefined && parseInt(modified) > currentSpace.account.lastRead)
        olderNewMessage = elem
      }
      if (olderNewMessage !== undefined) {
        olderNewMessage.scrollIntoView(false)
        return
      }
    }
    div.scrollTo(0, div.scrollHeight)
  }

  afterUpdate(() => {
    scroll()
    scrollHandler()
  })

  function scrollHandler () {
    if (currentSpace === undefined) return
    lastPosition = div.scrollTop
    const messages = div.getElementsByClassName('message')
    const divBottom = div.getBoundingClientRect().bottom
    for (let i = 0; i < messages.length; i++) {
      const elem = messages[i] as HTMLElement
      if (elem.getBoundingClientRect().bottom > divBottom) break
      const modified = elem.dataset.modified
      if (modified === undefined) continue
      const messageModified = parseInt(modified)
      lastTime = messageModified > lastTime ? messageModified : lastTime
    }
    if (lastTime > (currentSpace?.account?.lastRead ?? 0)) {
      if (!waitingUpdate) {
        waitingUpdate = true
        setTimeout(updateLastRead, 3000, currentSpace)
      }
    }
  }

  async function updateLastRead (space: Space) {
    if (space.account === undefined) {
      space.account = {
        lastRead: lastTime
      }
    } else {
      space.account.lastRead = lastTime
    }
    await client.updateDoc<Space>(
      space._class,
      space.space,
      space._id,
      {
        account: space.account
      },
      true
    )
    waitingUpdate = false
  }
</script>

<div class="msg-board" bind:this={div} on:scroll={scrollHandler}>
  {#if currentSpace}
    <Channel {messages} {currentSpace} />
  {/if}
</div>
<ReferenceInput thread={false} on:message={(event) => addMessage(event.detail)} />

<style lang="scss">
  .msg-board {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    margin: 10px 10px 0px;
    padding: 10px 10px 0px;
    overflow: auto;
  }
</style>
