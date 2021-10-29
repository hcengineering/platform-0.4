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
  import type { Comment, CommentRef, Message, MessageBookmark, WithMessage } from '@anticrm/chunter'
  import chunter from '@anticrm/chunter'
  import core, { parseFullRef } from '@anticrm/core'
  import type { Account, Class, Doc, Ref, Timestamp } from '@anticrm/core'
  import type { SpaceLastViews } from '@anticrm/notification'
  import { MessageNode, parseMessage, serializeMessage } from '@anticrm/text'
  import type { ItemRefefence } from '@anticrm/ui'
  import { ActionIcon, Button, DateTime, MessageViewer, showPopup } from '@anticrm/ui'
  import { getClient, selectDocument } from '@anticrm/workbench'
  import { newAllBookmarksQuery } from '../bookmarks'
  import { chunterbotAcc } from '../chunterbot'
  import type { MessageReference } from '../messages'
  import { findReferences } from '../messages'
  import Bookmark from './icons/Bookmark.svelte'
  import Pin from './icons/Pin.svelte'
  import ChatIcon from './icons/Chat.svelte'
  import MoreH from './icons/MoreH.svelte'
  import Share from './icons/Share.svelte'
  import MessagePopup from './MessagePopup.svelte'
  import RefControl from './RefControl.svelte'
  import ReferenceInput from './ReferenceInput.svelte'
  import Replies from './Replies.svelte'

  export let message: WithMessage
  export let spaceLastViews: SpaceLastViews | undefined
  export let thread: boolean = false
  export let showReferences = true
  export let showLabels = false

  let parsedMessage: MessageNode

  let references: MessageReference[] = []

  $: parsedMessage = parseMessage(message.message)
  $: references = showReferences ? findReferences(parsedMessage) : []

  let replyIds: Ref<Account>[] = []
  $: {
    const comments: CommentRef[] = (message as any).comments ?? []
    replyIds = comments.map((r) => r.userId)
  }

  let bookmark: MessageBookmark | undefined
  let pinMark: MessageBookmark | undefined
  let pinUser: Account | undefined

  const client = getClient()

  newAllBookmarksQuery(client, (result) => {
    const mids = result.filter((p) => p.message === message._id)
    bookmark = mids.find((p) => p.channelPin === false)
    pinMark = mids.find((p) => p.channelPin === true)
    if (pinMark !== undefined) {
      getUser(pinMark.modifiedBy).then((pu) => {
        pinUser = pu
      })
    }
  })

  let editMode = false
  let newMessageValue: string = ''

  async function getUser (userId: Ref<Account>): Promise<Account> {
    if (message.modifiedBy === chunter.account.Chunterbot) {
      return chunterbotAcc
    }

    return (await client.findAll(core.class.Account, { _id: userId }))[0]
  }

  async function onClick () {
    if (thread) {
      return
    }
    if (await client.isDerived(message._class, chunter.class.Comment)) {
      const cmt = message as Comment
      const { _id, _class } = parseFullRef(cmt.replyOf)
      selectDocument({ _id, _class })
    } else {
      selectDocument(message)
    }
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

  function isNew (message: WithMessage, spaceLastViews: SpaceLastViews | undefined): boolean {
    if (spaceLastViews === undefined || spaceLastViews.objectId !== message.space) return false
    if (!thread) {
      if (message.modifiedOn > spaceLastViews.lastRead) return true
      const lastModified = (message as Message).lastModified
      if (lastModified !== undefined) {
        if (spaceLastViews.objectLastReads instanceof Map) {
          const lastRead = spaceLastViews.objectLastReads.get(message._id)
          if (lastRead !== undefined) {
            return lastModified > lastRead
          }
        }
      }
    } else if ((message as Comment).replyOf !== undefined) {
      if (spaceLastViews.objectLastReads instanceof Map) {
        const fullRef = parseFullRef((message as Comment).replyOf)
        const lastRead = spaceLastViews.objectLastReads.get(fullRef._id)
        if (lastRead !== undefined) {
          return message.modifiedOn > lastRead
        }
      }
    }
    return false
  }

  function isNotificated (message: WithMessage, spaceLastViews: SpaceLastViews | undefined): boolean {
    if (spaceLastViews === undefined || spaceLastViews.objectId !== message.space) return false
    if (spaceLastViews.notificatedObjects.includes(message._id)) return true
    if (!thread) {
      const comments = (message as Message).comments
      for (const comment of comments ?? []) {
        if (spaceLastViews.notificatedObjects.includes(comment._id)) return true
      }
    }
    return false
  }

  function refAction (doc: ItemRefefence): void {
    selectDocument({ _id: doc.id as Ref<Doc>, _class: doc.class as Ref<Class<Doc>> })
  }
  async function updateMessage (message: WithMessage, newMessage: string): Promise<void> {
    if (newMessageValue !== message.message) {
      await client.updateDoc(message._class, message.space, message._id, {
        message: newMessage
      })
    }
  }

  let selElement: HTMLElement
  const findNode = (el: HTMLElement, name: string): any => {
    while (el.parentNode !== null) {
      if (el.classList.contains(name)) return el
      el = el.parentNode as HTMLElement
    }
    return false
  }
  const showMsgPopup = (ev?: Event): void => {
    selElement = findNode(ev?.currentTarget as HTMLElement, 'message-container')
    selElement.classList.add('selected')
    showPopup(MessagePopup, { message }, ev?.currentTarget as HTMLElement, (result) => {
      if (result && result === 'edit') editMode = true
      selElement.classList.remove('selected')
    })
  }
  const toggleBookmark = () => {
    if (bookmark !== undefined) {
      client.removeDoc(bookmark._class, client.userSpace(), bookmark._id)
    } else {
      client.createDoc(chunter.class.Bookmark, client.userSpace(), {
        message: message._id,
        channelPin: false
      })
    }
  }
</script>

<div
  class="message-container"
  class:no-thread={!thread}
  class:isNew={isNew(message, spaceLastViews) || isNotificated(message, spaceLastViews)}
  class:isNotificated={isNotificated(message, spaceLastViews)}
  data-created={message.createOn}
  data-modified={message.modifiedOn}
  data-id={message._id}
>
  {#if showLabels && (bookmark || pinMark)}
    <div class="top-container">
      <div class="flex-row-center top-panel">
        {#if pinMark !== undefined}
          <div class="flex-row-center section">
            <Pin size={8} filled />
            <span>pined by {pinUser?.name}</span>
          </div>
        {/if}
        {#if bookmark !== undefined}
          <div class="flex-row-center section primary">
            <Bookmark size={10} filled />
            <span>saved to bookmarks</span>
          </div>
        {/if}
      </div>
    </div>
  {/if}
  <slot name="header" />

  <div class="container">
    {#if user}
      <div class="avatar"><img src={user?.avatar ?? ''} alt={user?.name} /></div>
    {/if}
    <div class="message">
      {#if !editMode}
        <div class="header">
          <div>
            {#if user}
              {user.name}
            {/if}
            <span>
              <DateTime value={message.modifiedOn} timeOnly={isToday(message.modifiedOn)} />
            </span>
          </div>
          <div class="buttons">
            <div class="tool">
              <ActionIcon icon={MoreH} size={20} action={showMsgPopup} />
            </div>
            <div class="tool">
              <ActionIcon icon={Bookmark} size={20} action={toggleBookmark} filled={bookmark !== undefined} />
            </div>
            <div class="tool"><ActionIcon icon={Share} size={20} /></div>
            {#if !thread}
              <div class="tool">
                <ActionIcon label={chunter.string.ReplyInThread} icon={ChatIcon} size={20} action={() => onClick()} />
              </div>
            {/if}
          </div>
        </div>
        <div class="text">
          <MessageViewer message={parsedMessage} {refAction} />
          {#if message.modifiedOn !== message.createOn}
            <div class="edited-placeholder">(edited)</div>
          {/if}
        </div>
        {#if references.length > 0}
          <div class:references={!thread} class:references-thread={thread}>
            {#each references as ref}
              <RefControl reference={ref} />
            {/each}
          </div>
        {/if}
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
      {:else}
        <!-- // This is edit mode -->
        <div class="text">
          <ReferenceInput
            submitEnabled={false}
            lines={Math.min(message.message.split('\n').length + 3, 10)}
            currentSpace={message.space}
            objectId={message._id}
            objectClass={message._class}
            editorContent={parseMessage(message.message)}
            on:update={(detail) => {
              newMessageValue = serializeMessage(detail.detail)
            }}
          />
        </div>
        <div class="footer">
          <div class="flex">
            <Button
              size={'small'}
              label={chunter.string.CancelEdit}
              on:click={() => {
                editMode = false
              }}
            />
            <Button
              size={'small'}
              label={chunter.string.SaveEdit}
              on:click={() => {
                updateMessage(message, newMessageValue)
                message.message = newMessageValue
                editMode = false
              }}
            />
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style lang="scss">
  .message-container {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    padding-bottom: 15px;
    border-radius: 12px;
    padding: 2px;
    padding-right: 10px;

    &.isNew {
      background-color: var(--theme-bg-accent-color);
    }
    &.isNotificated {
      border: 1px solid !important;
      border-color: var(--theme-bg-focused-border);
    }
    &.no-thread {
      padding: 0.75rem;
      border: 1px solid transparent;
    }
    .references {
      margin-left: 0px;
    }
    .references-thread {
      margin-left: 0px;
    }

    &:hover > .container .message .header .buttons,
    &.selected > .container .message .header .buttons {
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

          .edited-placeholder {
            opacity: 0.6;
            display: flex;
            flex-direction: row-reverse;
          }
        }
        .footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 32px;
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
      .top-container .top-panel .section {
        border-radius: 0 0 0.25rem 0.25rem;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
      }
    }

    .top-container {
      position: relative;
      height: 1rem;

      .top-panel {
        position: absolute;
        top: -0.75rem;
        left: 3.25rem;
        font-weight: 500;
        font-size: 0.625rem;

        .section {
          margin-right: 0.5rem;
          padding: 0.25rem 0.5rem;
          background-color: var(--theme-bg-accent-color);
          border-radius: 0.25rem;
          span {
            margin-left: 0.25rem;
          }
          &.primary {
            background-color: var(--theme-popup-bg);
          }
        }
      }
    }
  }
</style>
