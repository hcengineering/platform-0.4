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
  import { FindFunction } from '@anticrm/richeditor'
  import type { IntlString } from '@anticrm/status'
  import type { CompletionItem } from '../../types'
  import { createEventDispatcher, onDestroy } from 'svelte'
  import Label from '../Label.svelte'
  import MarkdownViewer from './MarkdownViewer.svelte'
  import MDRefEditor from './MDRefEditor.svelte'
  import { Doc } from '@anticrm/core'

  export let value: string = ''
  export let label: IntlString | undefined
  export let placeholder: string = 'Start typing...'
  export let findFunction: FindFunction
  export let completions: CompletionItem[] = []
  export let autoFocus = false
  export let refAction: (doc: Pick<Doc, '_id' | '_class'>) => void = () => {}

  let editMode = false

  const dispatch = createEventDispatcher()

  let div: HTMLElement | undefined
  let resizeObserver: ResizeObserver | undefined
  let minHeight = '75px'

  $: if (div) {
    resizeObserver?.disconnect()
    resizeObserver = new ResizeObserver(() => {
      const newHeight = div?.clientHeight
      if (newHeight !== undefined && newHeight >= 75) {
        minHeight = `${newHeight}px`
      }
    })
    resizeObserver.observe(div)
  }

  onDestroy(() => {
    resizeObserver?.disconnect()
  })
</script>

{#if editMode}
  <MDRefEditor
    bind:value
    {label}
    {placeholder}
    height={minHeight}
    {findFunction}
    {completions}
    on:blur={(e) => {
      dispatch('blur', e.detail)
      editMode = false
    }}
    on:prefix
    {autoFocus}
  />
{:else}
  <div
    class="ref-container"
    on:click={() => {
      editMode = true
    }}
  >
    <div class="label"><Label {label} /></div>
    <div bind:this={div} class="textInput" style={`min-height: ${minHeight};`}>
      <MarkdownViewer message={value} {refAction} />
    </div>
  </div>
{/if}

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
      min-height: 48px;
      margin: -3px;
      padding: 5px;
      background-color: var(--theme-dialog-bg-accent);
      border: 1px solid var(--theme-dialog-divider);
      border-radius: 12px;

      &:focus-within {
        border-color: var(--primary-button-enabled);
      }
    }
  }
</style>
