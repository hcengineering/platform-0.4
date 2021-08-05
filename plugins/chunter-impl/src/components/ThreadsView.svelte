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
  import { getFullRef } from '@anticrm/core'
  import type { Ref } from '@anticrm/core'
  import type { QueryUpdater } from '@anticrm/presentation'
  import { getCurrentLocation, IconClose, navigate, ScrollBox, Label } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import chunter from '../plugin'
  import Comments from './Comments.svelte'
  import MsgView from './Message.svelte'
  import ReferenceInput from './ReferenceInput.svelte'

  const client = getClient()

  export let id: Ref<Message>
  let message: Message | undefined

  let lq: QueryUpdater<Message> | undefined

  $: {
    lq = client.query(lq, chunter.class.Message, { _id: id }, (result) => {
      message = result[0]
    })
  }

  function close () {
    const loc = getCurrentLocation()
    loc.path.length = 3
    navigate(loc)
  }

  function addMessage (text: string): void {
    client.createDoc(chunter.class.Comment, message!.space, {
      replyOf: getFullRef(message!._id, message!._class),
      message: text
    })
  }
</script>

<div class="header">
  <div class="title"><Label label={chunter.string.Thread} /></div>
  <div class="tool" on:click={close}><IconClose size={16} /></div>
</div>
<div class="content">
  {#if message}
    <ScrollBox vertical>
      <MsgView {message} thread />
      <Comments {message} />
    </ScrollBox>
    <ReferenceInput thread={false} on:message={(event) => addMessage(event.detail)} />
  {/if}
</div>

<style lang="scss">
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .title {
      flex-grow: 1;
      font-weight: 500;
      font-size: 20px;
      line-height: 26px;
      color: var(--theme-caption-color);
      user-select: none;
    }
    .tool {
      width: 16px;
      height: 16px;
      margin-left: 12px;
      opacity: 0.4;
      cursor: pointer;
      &:hover {
        opacity: 1;
      }
    }
  }

  .content {
    height: calc(100vh - 204px);
  }
</style>
