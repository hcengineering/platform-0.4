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
  import type { Message, Message as MessageModel } from '@anticrm/chunter'
  import type { QueryUpdater } from '@anticrm/presentation'
  import Channel from './Channel.svelte'
  import ReferenceInput from './ReferenceInput.svelte'
  import chunter from '../plugin'
  import { getClient } from '@anticrm/workbench'
  import { afterUpdate, beforeUpdate } from 'svelte'

  export let currentSpace: Ref<Space>

  const client = getClient()
  let div: HTMLElement
  let autoscroll: boolean = true
  let messages: MessageModel[] = []

  function addMessage (message: string): void {
    client.createDoc(chunter.class.Message, currentSpace, {
      message
    })
  }

  let query: QueryUpdater<Message> | undefined
  let lastPosition = 0

  $: if (currentSpace !== undefined) {
    query = client.query(query, chunter.class.Message, { space: currentSpace }, (result) => {
      messages = result
    })
  }

  beforeUpdate(() => {
    if (div) {
      autoscroll = div.scrollTop > div.scrollHeight - div.clientHeight - 50
      lastPosition = div.scrollTop
    }
  })

  afterUpdate(() => {
    if (autoscroll) div.scrollTo(0, div.scrollHeight)
    else div.scrollTo(0, lastPosition)
  })
</script>

<div class="msg-board" bind:this={div}>
  <Channel {messages} />
</div>
<ReferenceInput thread={false} on:message={(event) => addMessage(event.detail)} />

<style lang="scss">
  .msg-board {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    margin: 15px 15px 0px;
    padding: 25px 25px 0px;
    overflow: auto;
  }
</style>
