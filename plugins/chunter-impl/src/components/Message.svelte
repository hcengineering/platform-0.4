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
  import chunter from '@anticrm/chunter'
  import core, { Account, Class, Doc, parseFullRef, Ref, Timestamp } from '@anticrm/core'
  import type { SpaceNotifications } from '@anticrm/notification'
  import type { MessageNode } from '@anticrm/text'
  import { parseMessage } from '@anticrm/text'
  import type { ItemRefefence } from '@anticrm/ui'
  import { ActionIcon, DateTime, MessageViewer } from '@anticrm/ui'
  import { getClient, selectDocument } from '@anticrm/workbench'
  import { chunterbotAcc } from '../chunterbot'
  import type { MessageReference } from '../messages'
  import { findReferences } from '../messages'
  import Bookmark from './icons/Bookmark.svelte'
  import ChatIcon from './icons/Chat.svelte'
  import MoreH from './icons/MoreH.svelte'
  import Share from './icons/Share.svelte'
  import RefControl from './RefControl.svelte'
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

  async function getUser (userId: Ref<Account>): Promise<Account> {
    if (message.modifiedBy === chunter.account.Chunterbot) {
      return chunterbotAcc
    }

    return (await client.findAll(core.class.Account, { _id: userId }))[0]
  }

  function onClick () {
    if (thread) {
      return
    }
    selectDocument(message)
  }

  function isToday (value: Date | Timestamp): boolean {
    const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime()
    const date = new Date(value).getTime()
    return date - today > 0
  }

  let user: Account | undefined

  const updaterUser = async (msg: Message) => {
    user = await getUser(msg.modifiedBy)
  }
  $: updaterUser(message)

  function isNew (message: WithMessage, notifications: SpaceNotifications | undefined): boolean {
    if (notifications === undefined || notifications.objectId !== message.space) return false
    if (notifications.notificatedObjects.includes(message._id)) return true
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
  function refAction (doc: ItemRefefence): void {
    selectDocument({ _id: doc.id as Ref<Doc>, _class: doc.class as Ref<Class<Doc>> })
  }
</script>

<div class="message-container" class:no-thread={!thread} class:isNew={isNew(message, notifications)}>
  <div class="container">
    {#if user}
      <div class="avatar"><img src={user?.avatar ?? ''} alt={user?.name} /></div>
    {/if}
    <div
      class="message"
      data-modified={message.modifiedOn}
      data-lastmodified={getLastModified(message)}
      data-id={message._id}
    >
      <div class="header">
        <div>
          {#if user}
            {user?.name ?? ''}
          {/if}
          <span>
            <DateTime value={message.modifiedOn} timeOnly={isToday(message.modifiedOn)} />
          </span>
        </div>
        {#if !thread}
          <div class="buttons">
            <div class="tool"><ActionIcon icon={MoreH} size={20} /></div>
            <div class="tool"><ActionIcon icon={Bookmark} size={20} /></div>
            <div class="tool"><ActionIcon icon={Share} size={20} /></div>
            <div class="tool">
              <ActionIcon label={chunter.string.ReplyInThread} icon={ChatIcon} size={20} action={() => onClick()} />
            </div>
          </div>
        {/if}
      </div>
      <div class="text">
        <MessageViewer message={parsedMessage} {refAction} />
      </div>
      {#if replyIds.length > 0 && !thread}
        <div class="footer">
          <div>
            <!-- <Reactions /> -->
          </div>
          <div>
            {#if replyIds.length > 0}<Replies replies={replyIds} on:click={onClick} />{/if}
          </div>
        </div>
      {/if}
    </div>
  </div>
  {#if references.length > 0}
    <div class:references={!thread} class:references-thread={thread}>
      {#each references as ref}
        <RefControl reference={ref} />
      {/each}
    </div>
  {/if}
</div>

<style lang="scss">
  .message-container {
    display: flex;
    flex-direction: column;
    padding-bottom: 20px;
    border-radius: 12px;
    padding: 20px;

    &.isNew {
      background-color: var(--theme-bg-accent-color);
    }
    &.no-thread {
      padding: 10px;
      background-color: transparent;
      border: 1px solid transparent;
    }
    .references {
      margin-left: 76px;
    }
    .references-thread {
      margin-left: 50px;
    }

    &:hover > .container .message .header .buttons {
      visibility: visible;
    }

    .container {
      flex-shrink: 0;
      display: flex;

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

          display: flex;
          justify-content: space-between;

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

      .buttons {
        position: relative;
        visibility: hidden;
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
    }

    &:hover {
      background-color: var(--theme-button-bg-enabled);
      border-color: var(--theme-bg-accent-color);
    }
  }
</style>
