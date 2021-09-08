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
  import type { Ref } from '@anticrm/core'
  import { getFullRef } from '@anticrm/core'
  import type { QueryUpdater } from '@anticrm/presentation'
  import { IconClose, Label, ScrollBox } from '@anticrm/ui'
  import { getRouter } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import type { WorkbenchRoute } from '@anticrm/workbench'
  import chunter from '../plugin'
  import ChannelSeparator from './ChannelSeparator.svelte'
  import Comments from './Comments.svelte'
  import MsgView from './Message.svelte'
  import ReferenceInput from './ReferenceInput.svelte'

  const client = getClient()
  const router = getRouter<WorkbenchRoute>()

  export let id: Ref<Message>
  let message: Message | undefined

  let lq: QueryUpdater<Message> | undefined

  $: {
    lq = client.query(lq, chunter.class.Message, { _id: id }, (result) => {
      message = result[0]
    })
  }

  function close () {
    router.navigate({
      itemId: undefined
    })
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
    <ScrollBox autoscrollable={true} vertical>
      <MsgView {message} thread />
      <ChannelSeparator label={chunter.string.RepliesText} line />
      <Comments {message} />
    </ScrollBox>
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
      &:hover { opacity: 1; }
    }
  }
  .content { flex-grow: 1; }
  .ref-input { margin: 20px 0 0; }
</style>
