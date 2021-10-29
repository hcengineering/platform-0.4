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
  import { afterUpdate, onMount } from 'svelte'
  import type { IntlString } from '@anticrm/platform'
  import Label from './Label.svelte'

  export let label: IntlString | undefined = undefined
  export let width: string | undefined = undefined
  // Number is not really necessary to be here, just a quick fix until we implement some NumericEditBox
  export let value: string | number | undefined = undefined
  export let password: boolean | undefined = undefined
  export let id: string | undefined = undefined
  export let placeholder: string = 'Start typing...'
  export let maxWidth: string | undefined
  export let focus: boolean = false

  let text: HTMLElement
  let input: HTMLInputElement
  let style: string

  $: style = maxWidth ? `max-width: ${maxWidth};` : ''

  function computeSize (t: EventTarget | null) {
    const target = t as HTMLInputElement
    const value = target.value
    text.innerHTML = (value === '' ? placeholder : value).split(' ').join('&nbsp;')
    target.style.width = text.clientWidth + 8 + 'px'
  }

  onMount(() => {
    if (focus) {
      input.focus()
      focus = false
    }
    computeSize(input)
  })
  afterUpdate(() => {
    computeSize(input)
  })
</script>

<div class="editbox" style={width ? 'width: ' + width : ''}>
  <div class="text" bind:this={text} />
  {#if label}<div class="label"><Label {label} /></div>{/if}
  {#if password}
    <input
      bind:this={input}
      type="password"
      {id}
      {style}
      bind:value
      {placeholder}
      on:change
      on:keyup
      on:blur
      on:focus
      on:click|stopPropagation
      on:input={(ev) => ev.target && computeSize(ev.target)}
    />
  {:else}
    <input
      bind:this={input}
      type="text"
      {id}
      {style}
      bind:value
      {placeholder}
      on:change
      on:keyup
      on:blur
      on:focus
      on:click|stopPropagation
      on:input={(ev) => ev.target && computeSize(ev.target)}
    />
  {/if}
</div>

<style lang="scss">
  .text {
    position: absolute;
    visibility: hidden;
  }
  .editbox {
    display: inline-flex;
    flex-direction: column;
    align-items: flex-start;

    .label {
      margin-bottom: 4px;
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--theme-caption-color);
      opacity: 0.8;
      pointer-events: none;
      user-select: none;
    }

    input {
      max-width: 100%;
      margin: -4px;
      padding: 2px;
      color: inherit;
      background-color: transparent;
      border: 2px solid transparent;
      border-radius: 2px;
      outline: none;
      font-weight: inherit;

      &:focus {
        border-color: var(--primary-button-enabled);
      }
      &::placeholder {
        color: var(--theme-content-dark-color);
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
  }
</style>
