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
  import { onMount } from 'svelte'
  import type { IntlString } from '@anticrm/platform'
  import CheckBox from './CheckBox.svelte'

  export let label: IntlString
  export let checked: boolean = false
  export let editable: boolean = false

  let text: HTMLElement
  let input: HTMLInputElement
  let onEdit: boolean = false

  $: {
    if (text && input) {
      if (onEdit) {
        text.style.visibility = 'hidden'
        input.style.visibility = 'visible'
        input.focus()
      } else {
        input.style.visibility = 'hidden'
        text.style.visibility = 'visible'
      }
    }
  }

  const findNode = (el: Node, name: string): any => {
    while (el.parentNode !== null) {
      if (el.classList.contains(name)) return el
      el = el.parentNode
    }
    return false
  }
  const waitClick = (event: any): void => {
    if (onEdit) {
      if (!findNode(event.target, 'edit-item')) onEdit = false
    }
  }

  function computeSize (t: EventTarget | null) {
    const target = t as HTMLInputElement
    const value = target.value.charCodeAt(target.value.length - 1) === 10 ? 18 : 0
    text.innerHTML = label.replaceAll(' ', '&nbsp;')
    target.style.width = text.clientWidth + 6 + 'px'
    target.style.height = text.clientHeight + value + 6 + 'px'
  }

  onMount(() => {
    computeSize(input)
  })

  const dispatch = createEventDispatcher()
  function changeItem () {
    dispatch('change', { checked, label })
  }
</script>

<svelte:window on:mousedown={waitClick} />
<div class="checkBox-container">
  <div style="margin-top: 1px;">
    <CheckBox bind:checked on:change={changeItem} {editable} />
  </div>
  <div
    class="label"
    on:click={() => {
      if (editable) {
        onEdit = true
      }
    }}
  >
    <textarea
      bind:this={input}
      type="text"
      bind:value={label}
      class="edit-item"
      on:input={(ev) => ev.target && computeSize(ev.target)}
      on:change={changeItem}
    />
    <div class="text" class:checked bind:this={text}>{label}</div>
  </div>
</div>

<style lang="scss">
  .checkBox-container {
    display: flex;
    align-items: stretch;

    .label {
      position: relative;
      margin-left: 16px;
      width: 100%;
      color: var(--theme-caption-color);

      .edit-item {
        width: 100%;
        min-height: 20px;
        height: minmax(20px, auto);
        margin: -3px;
        padding: 2px;
        font-family: inherit;
        font-size: inherit;
        color: var(--theme-caption-color);
        background-color: transparent;
        border: 1px solid transparent;
        border-radius: 2px;
        outline: none;
        overflow-y: scroll;
        resize: none;
        overflow-wrap: break-word;

        &:focus {
          border-color: var(--primary-button-enabled);
        }

        &::-webkit-contacts-auto-fill-button,
        &::-webkit-credentials-auto-fill-button {
          visibility: hidden;
          display: none !important;
          pointer-events: none;
          height: 0;
          width: 0;
          margin: 0;
        }
      }
      .text {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: pre-wrap;
        overflow-wrap: break-word;

        &.checked {
          text-decoration: line-through;
          color: var(--theme-content-dark-color);
        }
      }
    }
  }
</style>
