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
  import core from '@anticrm/core'
  import type { DocumentQuery, Title } from '@anticrm/core'
  import { QueryUpdater } from '@anticrm/presentation'
  import type { EditorActions, EditorContentEvent } from '@anticrm/richeditor'
  import { createTextTransform, MessageEditor } from '@anticrm/richeditor'
  import { schema } from '@anticrm/richeditor'
  import type { MessageNode } from '@anticrm/text'
  import { newMessageDocument, serializeMessage } from '@anticrm/text'
  import type { CompletionItem, CompletionPopupActions } from '@anticrm/ui'
  import { CompletionPopup } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import { createEventDispatcher } from 'svelte'
  import Attach from './icons/Attach.svelte'
  import Emoji from './icons/Emoji.svelte'
  import GIF from './icons/GIF.svelte'
  import Send from './icons/Send.svelte'
  import TextStyle from './icons/TextStyle.svelte'

  export let thread: boolean = false
  export let withoutMargin: boolean = false

  export let stylesEnabled = false
  // If specified, submit button will be enabled, message will be send on any modify operation
  export let submitEnabled = true
  export let lines = 1

  const dispatch = createEventDispatcher()

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
  let editorContent: MessageNode = newMessageDocument()

  let htmlEditor: MessageEditor & EditorActions

  const triggers = ['@', '#', '[[']

  let currentPrefix = ''

  interface ItemRefefence {
    id: string
    class: string
  }

  interface ExtendedCompletionItem extends CompletionItem, ItemRefefence {}
  let completions: CompletionItem[] = []
  let completionControl: CompletionPopup & CompletionPopupActions

  let popupVisible = false

  let lq: QueryUpdater<Title> | undefined

  const client = getClient()

  function query (prefix: string): DocumentQuery<Title> {
    return {
      title: { $like: prefix + '%' }
    }
  }

  $: if (currentPrefix !== '') {
    lq = client.query(
      lq,
      core.class.Title,
      query(currentPrefix),
      (docs) => {
        completions = updateTitles(docs)
      },
      { limit: 50 }
    )
  }

  function updateTitles (docs: Title[]): CompletionItem[] {
    const items: CompletionItem[] = []
    for (const value of docs) {
      // if (startsWith(value.title.toString(), currentPrefix)) {
      const kk = value.title
      items.push({
        key: `${value.objectId}${value.title}`,
        completion: value.objectId,
        label: kk,
        title: `${kk} - ${value.objectClass}`,
        class: value.objectClass,
        id: value.objectId
      } as ExtendedCompletionItem)
      // }
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

  function updateStyle (event: EditorContentEvent) {
    styleState = event

    if (event.completionWord.length === 0) {
      currentPrefix = ''
      popupVisible = false
      return
    }
    if (event.completionWord.startsWith('[[')) {
      if (event.completionWord.endsWith(']')) {
        popupVisible = false
        currentPrefix = ''
      } else {
        currentPrefix = event.completionWord.substring(2)
        if (currentPrefix.length > 0) {
          popupVisible = true
        }
      }
    } else {
      currentPrefix = ''
      popupVisible = false
    }
    dispatch('update', editorContent)
  }

  function handlePopupSelected (value: CompletionItem) {
    let extra = 0
    if (styleState.completionEnd !== null && styleState.completionEnd.endsWith(']]')) {
      extra = styleState.completionEnd.length
    }
    const vv = value as ExtendedCompletionItem
    htmlEditor.insertMark(
      '[[' + value.label + ']]',
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
    if (!styleState.isEmpty) {
      dispatch('message', serializeMessage(editorContent))
    }
    editorContent = newMessageDocument()
  }

  const transformFunction = createTextTransform(findTitle)
</script>

<div class="ref-container" class:withoutMargin>
  <div class="textInput" style={`height: ${lines + 1}em;`}>
    <div
      class="inputMsg"
      class:thread
      class:edit-box-vertical={stylesEnabled}
      class:edit-box-horizontal={!stylesEnabled}
      on:keydown={onKeyDown}
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
            Placeholder...
          {/if}
        </div>
        {#if popupVisible && completions.length > 0}
          <CompletionPopup
            bind:this={completionControl}
            on:blur={(e) => (completions = [])}
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
  <div class="buttons">
    <div class="tool"><Attach /></div>
    <div class="tool"><TextStyle /></div>
    <div class="tool"><Emoji /></div>
    <div class="tool"><GIF /></div>
  </div>
</div>

<style lang="scss">
  .ref-container {
    display: flex;
    flex-direction: column;
    min-height: 74px;
    margin: 20px 40px;

    &.withoutMargin {
      margin: 0px;
    }

    .textInput {
      position: relative;
      display: flex;
      justify-content: space-between;
      align-items: center;
      min-height: 44px;
      padding: 12px 16px;
      background-color: var(--theme-bg-accent-color);
      border: 1px solid var(--theme-bg-accent-hover);
      border-radius: 12px;

      &:focus-within {
        background-color: var(--theme-bg-focused-color);
        border-color: var(--theme-bg-focused-border);
      }

      .inputMsg {
        width: 100%;
        height: 100%;
        color: var(--theme-content-color);
        background-color: transparent;
        border: none;
        outline: none;
        &.thread {
          width: auto;
        }

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
        display: flex;
        justify-content: center;
        align-items: center;
        margin-left: 8px;
        padding: 0;
        width: 20px;
        height: 20px;
        background-color: transparent;
        border: 1px solid transparent;
        border-radius: 4px;
        outline: none;
        cursor: pointer;

        .icon {
          width: 20px;
          height: 20px;
          opacity: 0.3;
          cursor: pointer;
          &:hover {
            opacity: 1;
          }
        }
        &:focus {
          border: 1px solid var(--primary-button-focused-border);
          box-shadow: 0 0 0 3px var(--primary-button-outline);
          & > .icon {
            opacity: 1;
          }
        }
      }
    }
    .buttons {
      margin: 10px 0 0 8px;
      display: flex;

      .tool {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 20px;
        height: 20px;
        opacity: 0.3;
        cursor: pointer;
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
