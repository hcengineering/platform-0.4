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
  import { createTextTransform, MessageEditor } from '@anticrm/richeditor'
  import type { EditorActions, EditorContentEvent, FindFunction } from '@anticrm/richeditor'
  import { schema } from '@anticrm/richeditor'
  import type { IntlString } from '@anticrm/status'
  import type { MessageNode } from '@anticrm/text'
  import { newMessageDocument, parseMessage, serializeMessage } from '@anticrm/text'
  import type { CompletionItem, CompletionPopupActions, ExtendedCompletionItem } from '../types'
  import CompletionPopup from './CompletionPopup.svelte'
  import { createEventDispatcher } from 'svelte'
  import Label from './Label.svelte'

  export let lines = 10
  export let value: string = ''
  export let label: IntlString | undefined
  export let placeholder: string = 'Start typing...'
  export let findFunction: FindFunction
  export let completions: CompletionItem[] = []

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

  $: {
    const v = serializeMessage(editorContent)
    if (v !== value) {
      editorContent = parseMessage(value)
    }
  }

  let htmlEditor: MessageEditor & EditorActions

  const triggers = ['@', '#', '[[']

  let currentPrefix = ''

  let completionControl: CompletionPopup & CompletionPopupActions

  let popupVisible = false

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
        if (event.completionWord.substring(2).length > 0) {
          currentPrefix = event.completionWord
          popupVisible = true
        }
      }
    } else if (event.completionWord.startsWith('@')) {
      currentPrefix = event.completionWord
      popupVisible = true
    } else {
      currentPrefix = ''
      popupVisible = false
    }
    dispatch('prefix', currentPrefix)
  }

  function handlePopupSelected (value: CompletionItem) {
    const isMention = styleState.completionWord.startsWith('@')
    let extra = 0
    if (styleState.completionEnd !== null && styleState.completionEnd.endsWith(']]')) {
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
      }
    }
  }
  $: transformFunction = createTextTransform(findFunction)
</script>

<div class="ref-container">
  <div class="label"><Label {label} /></div>
  <div class="textInput" style={`height: ${lines * 1.5 + 1}em;`}>
    <div class="inputMsg" on:keydown={onKeyDown}>
      <MessageEditor
        bind:this={htmlEditor}
        bind:content={editorContent}
        enterNewLine
        {triggers}
        transformInjections={transformFunction}
        on:content={(event) => {
          editorContent = event.detail
          value = serializeMessage(editorContent)
          dispatch('value', value)
        }}
        on:blur
        on:styleEvent={(e) => updateStyle(e.detail)}
      >
        <div class="placeholder" slot="hoverMessage" let:empty let:hasFocus class:placeholder-hidden={!empty}>
          {placeholder}
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
  </div>
</div>

<style lang="scss">
  .ref-container {
    display: flex;
    flex-direction: column;
    min-height: 74px;

    .label {
      margin-bottom: 4px;
      font-size: 12px;
      font-weight: 500;
      color: var(--theme-caption-color);
      opacity: 0.8;
      pointer-events: none;
      user-select: none;
    }

    .textInput {
      position: relative;
      min-height: 44px;
      margin: -3px;
      padding: 2px;
      color: var(--theme-caption-color);
      background-color: transparent;
      border: 1px solid transparent;
      border-radius: 2px;

      &:focus-within {
        border-color: var(--primary-button-enabled);
      }

      .inputMsg {
        width: 100%;
        height: 100%;
        color: var(--theme-content-color);
        background-color: transparent;
        border: none;
        outline: none;
      }
    }

    .placeholder {
      position: absolute;
      top: 2px;
      color: var(--theme-content-trans-color);
      pointer-events: none;
      user-select: none;
      visibility: visible;
    }
    .placeholder-hidden {
      visibility: hidden;
    }
  }
</style>
