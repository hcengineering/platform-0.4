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
  import core, { Class, Doc } from '@anticrm/core'
  import type { Account, Ref, Space, Title } from '@anticrm/core'
  import type { EditorActions, EditorContentEvent, ItemRefefence } from '@anticrm/richeditor'
  import { createTextTransform, MessageEditor } from '@anticrm/richeditor'
  import { schema } from '@anticrm/richeditor'
  import type { MessageNode } from '@anticrm/text'
  import { newMessageDocument, serializeMessage } from '@anticrm/text'
  import { CompletionItem, CompletionPopupActions, Component } from '@anticrm/ui'
  import { CompletionPopup, Label } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import { createEventDispatcher } from 'svelte'
  import Attach from './icons/Attach.svelte'
  import Emoji from './icons/Emoji.svelte'
  import GIF from './icons/GIF.svelte'
  import Send from './icons/Send.svelte'
  import TextStyle from './icons/TextStyle.svelte'
  import Bold from './icons/Bold.svelte'
  import Italic from './icons/Italic.svelte'
  import Brackets from './icons/Brackets.svelte'
  import Mention from './icons/Mention.svelte'
  import chunter from '../plugin'
  import attachment, { Attachment, UploadAttachment } from '@anticrm/attachment'
  import { getPlugin } from '@anticrm/platform'
  import { QueryUpdater } from '@anticrm/presentation'

  export let stylesEnabled = false
  // If specified, submit button will be enabled, message will be send on any modify operation
  export let submitEnabled = true
  export let lines = 1
  export let currentSpace: Ref<Space> | undefined
  export let objectClass: Ref<Class<Doc>>
  export let objectId: Ref<Doc>

  const dispatch = createEventDispatcher()
  let input: HTMLElement
  let attachments: Array<UploadAttachment> = []

  let lq: QueryUpdater<UploadAttachment> | undefined
  $: lq = client.query(lq, attachment.class.Attachment, { objectId: objectId }, (result) => {
    attachments = result
  })

  let styleState: EditorContentEvent = {
    isEmpty: true,
    cursor: {
      left: 0,
      top: 0,
      bottom: 0,
      right: 0
    },
    bold: false,
    italic: false,
    completionWord: '',
    selection: {
      from: 0,
      to: 0
    },
    completionEnd: '',
    inputHeight: 0
  }
  export let editorContent: MessageNode = newMessageDocument()

  let htmlEditor: MessageEditor & EditorActions

  const triggers = ['@', '#', '[[']

  interface ExtendedCompletionItem extends CompletionItem, ItemRefefence {}
  let completions: CompletionItem[] = []
  let completionControl: CompletionPopup & CompletionPopupActions

  let popupVisible = false

  const client = getClient()

  async function getTitles (prefix: string) {
    const titles = await client.findAll(core.class.Title, { title: { $like: prefix + '%' } }, { limit: 50 })
    completions = updateTitles(titles)
  }

  function getLabel (value: Account): { label: string; fln: string } {
    const fln = ((value.firstName ?? '') + ' ' + (value.lastName ?? '')).trim()
    return { label: '@' + (fln.length > 0 ? fln : value.name) + ' ', fln }
  }

  async function getAccounts (prefix: string) {
    // Since accounts is part of model, they all in user environemnt already.
    let docs = (await client.findAll(core.class.Account, {})).filter((a) => {
      const { fln } = getLabel(a)
      const title = fln.length > 0 ? fln + `(${a.name})` : a.name
      return title.startsWith(prefix) || title.indexOf(prefix) !== -1
    })
    if (docs.length > 50) {
      docs = docs.slice(0, 50)
    }
    completions = updateAccounts(docs)
  }

  function updateTitles (docs: Title[]): CompletionItem[] {
    const items: CompletionItem[] = []
    for (const value of docs) {
      const kk = value.title
      items.push({
        key: `${value._id}${value.title}`,
        completion: value.objectId,
        label: kk,
        title: `${kk} - ${value.objectClass}`,
        class: value.objectClass,
        id: value.objectId
      } as ExtendedCompletionItem)
    }
    return items
  }

  function updateAccounts (docs: Account[]): CompletionItem[] {
    const items: CompletionItem[] = []
    for (const value of docs) {
      const { label, fln } = getLabel(value)
      items.push({
        key: value._id,
        completion: value._id,
        label,
        title: fln.length > 0 ? fln + `(${value.name})` : value.name,
        class: core.class.Account,
        id: `${currentSpace}-${value._id}`
      } as ExtendedCompletionItem)
    }
    return items
  }

  async function findTitle (title: string): Promise<ItemRefefence[]> {
    const docs = await client.findAll<Title>(core.class.Title, {
      title: title
    })

    for (const value of docs) {
      if (value.title === title) {
        return [
          {
            id: value.objectId,
            class: value.objectClass
          } as ItemRefefence
        ]
      }
    }
    return []
  }

  async function updateStyle (event: EditorContentEvent): Promise<void> {
    styleState = event

    if (event.completionWord.length === 0) {
      popupVisible = false
      return
    }
    if (event.completionWord.startsWith('[[')) {
      if (event.completionWord.endsWith(']')) {
        popupVisible = false
      } else {
        const currentPrefix = event.completionWord.substring(2)
        if (currentPrefix.length > 0) {
          await getTitles(currentPrefix)
          popupVisible = true
        }
      }
    } else if (event.completionWord.startsWith('@')) {
      const currentPrefix = event.completionWord.substring(1)
      await getAccounts(currentPrefix)
      popupVisible = true
    } else {
      popupVisible = false
    }
    dispatch('update', editorContent)
  }

  function handlePopupSelected (value: CompletionItem) {
    const isMention = styleState.completionWord.startsWith('@')
    let extra = 0
    if (styleState.completionEnd !== undefined) {
      extra = styleState.completionEnd.length
    }
    const vv = value as ExtendedCompletionItem
    const text = isMention ? value.label : '[[' + value.label + ']]'
    htmlEditor.insertMark(
      text,
      styleState.selection.from - styleState.completionWord.length,
      styleState.selection.to + extra,
      schema.marks.reference,
      {
        id: vv.id,
        class: vv.class
      }
    )
    htmlEditor.focus()
  }

  function onKeyDown (event: any): void {
    if (popupVisible) {
      if (event.key === 'ArrowUp') {
        completionControl.handleUp()
        event.preventDefault()
        return
      }
      if (event.key === 'ArrowDown') {
        completionControl.handleDown()
        event.preventDefault()
        return
      }
      if (event.key === 'Enter') {
        completionControl.handleSubmit()
        event.preventDefault()
        return
      }
      if (event.key === 'Escape') {
        completions = []
        popupVisible = false
        return
      }
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      handleSubmit()
      event.preventDefault()
    }
  }

  function handleSubmit (): void {
    syncAttachments()
    if (!styleState.isEmpty) {
      dispatch('message', serializeMessage(editorContent))
    }
    editorContent = newMessageDocument()
  }

  const transformFunction = createTextTransform(findTitle)

  function insertAttachment (item: Attachment) {
    const from = Math.max(styleState.selection.from, 1)
    htmlEditor.insertMark(item.name + ' ', from, styleState.selection.to, schema.marks.link, {
      href: item.url,
      title: item.name
    })
    htmlEditor.focus()
  }

  async function fileInputChange (e: Event): Promise<void> {
    const elem = e.target as HTMLInputElement
    const list = elem.files
    if (list === null || list.length === 0) return
    for (let index = 0; index < list.length; index++) {
      const file = list.item(index)
      if (file === null) continue
      await createAttachment(file)
    }
  }

  async function createAttachment (file: File): Promise<void> {
    const fileService = await getPlugin(attachment.id)
    let item: UploadAttachment
    // eslint-disable-next-line prefer-const
    item = await fileService.createAttachment(file, objectId, objectClass, currentSpace!, client, (item, progress) => {
      item.progress = progress
      attachments = attachments
    })
    if (attachments.find((p) => p._id === item._id) === undefined) {
      attachments.push(item)
    }
    attachments = attachments
  }

  async function drop (e: DragEvent): Promise<void> {
    const list = e.dataTransfer?.files
    if (list === undefined || list.length === 0) return
    for (let index = 0; index < list.length; index++) {
      const file = list.item(index)
      if (file === null) continue
      await createAttachment(file)
    }
  }

  function syncAttachments (): void {
    attachments.forEach((item) => {
      insertAttachment(item)
    })
  }
</script>

<div class="ref-container">
  <div class="border">
    {#if attachments.length > 0 && currentSpace !== undefined}
      <Component
        is={attachment.component.AttachmentList}
        props={{ items: attachments, horizontal: true, editable: true }}
      />
    {/if}
    <div class="flex-between textInput" style={`height: ${lines + 1}em;`}>
      <div
        class="inputMsg"
        class:edit-box-vertical={stylesEnabled}
        class:edit-box-horizontal={!stylesEnabled}
        on:keydown={onKeyDown}
        on:drop|preventDefault={drop}
        on:dragover|preventDefault
      >
        <MessageEditor
          bind:this={htmlEditor}
          bind:content={editorContent}
          {triggers}
          transformInjections={transformFunction}
          on:content={(event) => {
            editorContent = event.detail
          }}
          on:styleEvent={(e) => updateStyle(e.detail)}
        >
          <div class="label" slot="hoverMessage" let:empty={isEmpty}>
            {#if isEmpty}
              <Label label={chunter.string.NewMessagePlaceholder} />
            {/if}
          </div>
          {#if popupVisible && completions.length > 0}
            <CompletionPopup
              bind:this={completionControl}
              on:blur={() => (completions = [])}
              ontop={true}
              items={completions}
              pos={{
                left: styleState.cursor.left + 15,
                top: styleState.cursor.top - styleState.inputHeight,
                right: styleState.cursor.right + 15,
                bottom: styleState.cursor.bottom - styleState.inputHeight
              }}
              on:select={(e) => handlePopupSelected(e.detail)}
            />
          {/if}
        </MessageEditor>
      </div>
      {#if submitEnabled}
        <button class="sendButton" on:click={() => handleSubmit()}><div class="icon"><Send /></div></button>
      {/if}
    </div>
  </div>
  <div class="buttons">
    <input class="hidden" bind:this={input} on:change={fileInputChange} type="file" multiple={true} />
    <div
      class="tool"
      on:click={() => {
        input.click()
      }}
    >
      <Attach />
    </div>
    <div class="tool"><TextStyle /></div>
    <div
      class="tool"
      class:active={styleState.bold}
      on:click={() => {
        htmlEditor.toggleBold()
        htmlEditor.focus()
      }}
    >
      <Bold />
    </div>
    <div
      class="tool"
      class:active={styleState.italic}
      on:click={() => {
        htmlEditor.toggleItalic()
        htmlEditor.focus()
      }}
    >
      <Italic />
    </div>
    <div class="tool"><Brackets /></div>
    <div class="tool"><Mention /></div>
    <div class="tool"><Emoji /></div>
    <div class="tool"><GIF /></div>
  </div>
</div>

<style lang="scss">
  .ref-container {
    display: flex;
    flex-direction: column;
    min-height: 74px;

    .border {
      background-color: var(--theme-bg-accent-color);
      border: 1px solid var(--theme-bg-accent-hover);
      border-radius: 12px;

      &:focus-within {
        background-color: var(--theme-bg-focused-color);
        border-color: var(--theme-bg-focused-border);
      }

      .textInput {
        position: relative;
        min-height: 44px;
        padding: 12px 16px;

        .inputMsg {
          width: 100%;
          max-width: calc(100% - 32px);
          height: 100%;
          color: var(--theme-content-color);
          background-color: transparent;
          border: none;
          outline: none;

          .edit-box-horizontal {
            width: 100%;
            height: 100%;
            margin-top: 7px;
            align-self: center;
          }

          .edit-box-vertical {
            width: 100%;
            height: 100%;
            margin: 4px;
          }

          .label {
            position: absolute;
            top: 14px;
            font-size: 14px;
            line-height: 14px;
            color: var(--theme-caption-color);
            pointer-events: none;
            opacity: 0.3;
            transition: all 200ms;
            user-select: none;
          }
        }
        .sendButton {
          flex-shrink: 0;
          margin-left: 8px;
          width: 24px;
          min-width: 24px;
          height: 24px;
          border-radius: 4px;

          & .icon {
            opacity: 0.3;
          }
          &:hover .icon {
            opacity: 1;
          }
          &:focus {
            border: 1px solid var(--primary-button-focused-border);
            box-shadow: 0 0 0 3px var(--primary-button-outline);
            & .icon {
              opacity: 1;
            }
          }
        }
      }
    }

    .buttons {
      margin: 10px 0 0 8px;
      display: flex;

      .hidden {
        display: none;
      }

      .tool {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 20px;
        height: 20px;
        opacity: 0.3;
        cursor: pointer;

        &.active {
          opacity: 0.6;
        }

        &:hover {
          opacity: 1;
        }
      }
      .tool + .tool {
        margin-left: 16px;
      }
    }
  }
</style>
