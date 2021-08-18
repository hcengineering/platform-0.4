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
  import type { CommentRef, WithMessage } from '@anticrm/chunter'
  import { ActionIcon, getCurrentLocation, DateTime, MarkdownViewer, navigate } from '@anticrm/ui'
  import Bookmark from './icons/Bookmark.svelte'
  import Emoji from './icons/Emoji.svelte'
  import MoreH from './icons/MoreH.svelte'
  import Share from './icons/Share.svelte'
  import Reactions from './Reactions.svelte'
  import Replies from './Replies.svelte'
  import core from '@anticrm/core'
  import type { Account, Ref, Timestamp } from '@anticrm/core'
  import { getClient } from '@anticrm/workbench'
  import { onMount } from 'svelte'

  interface MessageData {
    _id: Ref<WithMessage>
    message: string
    modifiedOn: Timestamp
    createOn: Timestamp
    modifiedBy: Ref<Account>
  }

  export let message: MessageData
  export let thread: boolean = false

  let replyIds: Ref<Account>[] = []
  $: {
    const comments: CommentRef[] = (message as any).comments ?? []
    replyIds = comments.map((r) => r.userId)
  }

  const client = getClient()

  async function getUser (userId: Ref<Account>): Promise<Account> {
    return (await client.findAll(core.class.Account, { _id: userId }))[0]
  }

  function onClick () {
    if (thread) {
      return
    }
    const loc = getCurrentLocation()
    loc.path[3] = message._id
    loc.path.length = 4
    navigate(loc)
  }

  function isToday (value: Date | Timestamp): boolean {
    const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime()
    const date = new Date(value).getTime()
    return date - today > 0
  }

  let user: Account | undefined

  onMount(async () => {
    user = await getUser(message.modifiedBy)
  })
</script>

<div class="container" class:no-thread={!thread} on:click={onClick}>
  {#if user}
    <div class="avatar"><img src={user?.avatar ?? ''} alt={user?.name} /></div>
  {/if}
  <div class="message">
    <div class="header">
      {#if user}{user?.name ?? ''}{/if}<span
        ><DateTime value={message.modifiedOn} timeOnly={isToday(message.modifiedOn)} /></span
      >
    </div>
    <div class="text">
      <MarkdownViewer message={message.message} />
    </div>
    {#if replyIds.length > 0 && !thread}
      <div class="footer">
        <div>
          <Reactions />
        </div>
        <div>
          {#if replyIds.length > 0}<Replies replies={replyIds} />{/if}
        </div>
      </div>
    {/if}
  </div>
  {#if !thread}
    <div class="buttons">
      <div class="tool"><ActionIcon icon={MoreH} size={20} direction={'left'} /></div>
      <div class="tool"><ActionIcon icon={Bookmark} size={20} direction={'left'} /></div>
      <div class="tool"><ActionIcon icon={Share} size={20} direction={'left'} /></div>
      <div class="tool"><ActionIcon icon={Emoji} size={20} direction={'left'} /></div>
    </div>
  {/if}
</div>

<style lang="scss">
  .container {
    position: relative;
    display: flex;
    padding-bottom: 20px;

    .avatar {
      min-width: 36px;
      width: 36px;
      height: 36px;
      background-color: var(--theme-bg-accent-color);
      border-radius: 50%;
      user-select: none;
      overflow: hidden;
      img {
        max-width: 100%;
        max-height: 100%;
      }
    }

    .message {
      display: flex;
      flex-direction: column;
      width: 100%;
      margin-left: 16px;

      .header {
        font-weight: 500;
        font-size: 16px;
        line-height: 150%;
        color: var(--theme-caption-color);
        margin-bottom: 4px;

        span {
          margin-left: 8px;
          font-weight: 400;
          font-size: 14px;
          line-height: 18px;
          opacity: .4;
        }
      }
      .text {
        line-height: 150%;
      }
      .footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 32px;
        margin-top: 8px;
        user-select: none;

        div + div {
          margin-left: 16px;
        }
      }
    }
  }
  .no-thread {
    padding: 20px;
    background-color: transparent;
    border: 1px solid transparent;
    border-radius: 12px;

    .buttons {
      position: absolute;
      visibility: hidden;
      top: 12px;
      right: 12px;
      display: flex;
      flex-direction: row-reverse;
      user-select: none;

      .tool {
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1;
      }
      .tool + .tool {
        margin-right: 8px;
      }
    }

    &:hover > .buttons {
      visibility: visible;
    }
    &:hover {
      background-color: var(--theme-button-bg-enabled);
      border-color: var(--theme-bg-accent-color);
    }
  }
</style>
