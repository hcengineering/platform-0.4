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
  import { Message } from '@anticrm/chunter'
  import Comments from './Comments.svelte'
  import { Ref } from '@anticrm/core'
  import { getCurrentLocation, navigate } from '@anticrm/ui'
  import ScrollBox from '@anticrm/ui/src/components/ScrollBox.svelte'
  import { getClient } from '@anticrm/workbench'
  import { onDestroy } from 'svelte'
  import chunter from '../plugin'
  import MsgView from './Message.svelte'
  import { IconClose } from '@anticrm/ui'
  import ReferenceInput from './ReferenceInput.svelte'

  const client = getClient()

  export let id: Ref<Message>
  let message: Message | undefined

  let unsubscribe = () => {}

  $: {
    unsubscribe()
    unsubscribe = client.query(chunter.class.Message, { _id: id }, (result) => {
      message = result[0]
    })
  }

  onDestroy(() => {
    unsubscribe()
  })

  function close () {
    const loc = getCurrentLocation()
    loc.path.length = 3
    navigate(loc)
  }

  function addMessage (text: string): void {
    client.createDoc(chunter.class.Comment, message!.space, {
      replyOf: message!._id,
      message: text
    })
  }
</script>

<div class="header">
  <div class="title">Thread</div>
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

    .row {
      margin-top: 10px;
    }

    .progress {
      margin-top: 24px;
      span {
        margin-bottom: 8px;
        font-weight: 500;
        font-size: 10px;
        line-height: 13px;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        text-align: right;
      }
    }
  }
</style>