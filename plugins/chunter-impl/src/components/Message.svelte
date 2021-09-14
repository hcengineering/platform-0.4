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
  import type { Comment, CommentRef, Message, WithMessage } from '@anticrm/chunter'
  import core, { Account, parseFullRef, Ref, Timestamp } from '@anticrm/core'
  import type { SpaceNotifications } from '@anticrm/notification'
  import type { MessageNode } from '@anticrm/text'
  import { parseMessage } from '@anticrm/text'
  import { ActionIcon, DateTime, getRouter, MessageViewer } from '@anticrm/ui'
  import type { WorkbenchRoute } from '@anticrm/workbench'
  import { getClient } from '@anticrm/workbench'
  import { onMount } from 'svelte'
  import type { MessageReference } from '../messages'
  import { findReferences } from '../messages'
  import Bookmark from './icons/Bookmark.svelte'
  import Emoji from './icons/Emoji.svelte'
  import MoreH from './icons/MoreH.svelte'
  import Share from './icons/Share.svelte'
  import RefControl from './RefControl.svelte'
  import Reactions from './Reactions.svelte'
  import Replies from './Replies.svelte'

  export let message: WithMessage
  export let notifications: SpaceNotifications | undefined
  export let thread: boolean = false

  let parsedMessage: MessageNode

  let references: MessageReference[] = []

  $: parsedMessage = parseMessage(message.message)

  $: references = findReferences(parsedMessage)

  let replyIds: Ref<Account>[] = []
  $: {
    const comments: CommentRef[] = (message as any).comments ?? []
    replyIds = comments.map((r) => r.userId)
  }

  const client = getClient()
  const router = getRouter<WorkbenchRoute>()

  async function getUser (userId: Ref<Account>): Promise<Account> {
    return (await client.findAll(core.class.Account, { _id: userId }))[0]
  }

  function onClick () {
    if (thread) {
      return
    }
    router.navigate({
      itemId: message._id
    })
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

  function isNew (message: WithMessage, notifications: SpaceNotifications | undefined): boolean {
    if (notifications === undefined) return false
    if (!thread) {
      if (message.modifiedOn > notifications.lastRead) return true
      const comments = (message as Message).comments
      if (comments !== undefined) {
        let lastTime = notifications.lastRead
        if (notifications.objectLastReads.get !== undefined) {
          lastTime = notifications.objectLastReads.get(message._id) ?? lastTime
        }
        for (const comment of comments) {
          if (comment.lastModified > lastTime) return true
        }
      }
    } else if ((message as Comment).replyOf !== undefined) {
      let lastTime = notifications.lastRead
      if (notifications.objectLastReads.get !== undefined) {
        const fullRef = parseFullRef((message as Comment).replyOf)
        lastTime = notifications.objectLastReads.get(fullRef._id) ?? lastTime
      }
      return message.modifiedOn > lastTime
    }
    return false
  }

  function getLastModified (message: WithMessage): number {
    let lastModified = message.modifiedOn
    if (!thread) {
      const comments = (message as Message).comments
      if (comments !== undefined) {
        for (const comment of comments) {
          lastModified = lastModified > comment.lastModified ? lastModified : comment.lastModified
        }
      }
    }
    return lastModified
  }
</script>

<div class="message-container">
  <div class="container" class:no-thread={!thread} class:isNew={isNew(message, notifications)} on:click={onClick}>
    {#if user}
      <div class="avatar"><img src={user?.avatar ?? ''} alt={user?.name} /></div>
    {/if}
    <div class="message" data-modified={message.modifiedOn} data-lastmodified={getLastModified(message)}>
      <div class="header">
        {#if user}{user?.name ?? ''}{/if}<span
          ><DateTime value={message.modifiedOn} timeOnly={isToday(message.modifiedOn)} /></span
        >
      </div>
      <div class="text">
        <MessageViewer message={parsedMessage} />
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
        <div class="tool"><ActionIcon icon={MoreH} size={20} /></div>
        <div class="tool"><ActionIcon icon={Bookmark} size={20} /></div>
        <div class="tool"><ActionIcon icon={Share} size={20} /></div>
        <div class="tool"><ActionIcon icon={Emoji} size={20} /></div>
      </div>
    {/if}
  </div>
  {#if references.length > 0}
    <div class:references={!thread} class:references-thread={thread}>
      {#each references as ref}
        <pre>
          <RefControl reference={ref} />
        </pre>
      {/each}
    </div>
  {/if}
</div>

<style lang="scss">
  .message-container {
    display: flex;
    flex-direction: column;
    padding-bottom: 20px;

    .references {
      min-width: 466px;
      margin-left: 76px;
    }
    .references-thread {
      min-width: 466px;
      margin-left: 50px;
    }
    .container {
      flex-shrink: 0;
      display: flex;

      &.isNew {
        background-color: var(--theme-bg-accent-color);
      }

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
            opacity: 0.4;
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
    }
    &:hover {
      background-color: var(--theme-button-bg-enabled);
      border-color: var(--theme-bg-accent-color);
    }
  }
</style>
