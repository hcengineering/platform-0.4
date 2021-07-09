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
  import { createEventDispatcher } from 'svelte'

  import Send from './icons/Send.svelte'
  import Attach from './icons/Attach.svelte'
  import Emoji from './icons/Emoji.svelte'
  import GIF from './icons/GIF.svelte'
  import TextStyle from './icons/TextStyle.svelte'

  import { EditorActions, EditorContentEvent, MessageEditor } from '@anticrm/richeditor'
  import { MessageNode, newMessageDocument, serializeMessage } from '@anticrm/text'

  export let thread: boolean = false

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

  function updateStyle (event: EditorContentEvent) {
    styleState = event

    if (event.completionWord.length === 0) {
      currentPrefix = ''
      return
    }
    if (event.completionWord.startsWith('[[')) {
      if (event.completionWord.endsWith(']')) {
        currentPrefix = ''
      } else {
        currentPrefix = event.completionWord.substring(2)
      }
    } else {
      currentPrefix = ''
    }
    dispatch('update', editorContent)
  }

  function onKeyDown (event: any): void {
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
</script>

<div class="ref-container">
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
        on:content={(event) => {
          editorContent = event.detail
        }}
        on:styleEvent={(e) => updateStyle(e.detail)}
      />
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

    .textInput {
      display: flex;
      justify-content: space-between;
      // align-items: center;
      min-height: 44px;
      padding: 8px 16px;
      background-color: var(--theme-bg-accent-color);
      border: 1px solid var(--theme-bg-accent-color);
      border-radius: 12px;

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

        .flex-column {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .flex-row {
          display: flex;
          flex-direction: row;
          align-items: flex-end;
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
