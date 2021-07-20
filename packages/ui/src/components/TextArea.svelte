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
  import type { IntlString } from '@anticrm/platform'
  import Label from './Label.svelte'

  export let label: IntlString | undefined
  export let width: string | undefined
  export let value: string | undefined
  export let id: string | undefined
  export let lines: number = 5

  let divTA: HTMLElement
  let textArea: HTMLTextAreaElement
  const scroll = () => {
    if (textArea.scrollTop < 1) divTA.classList.remove('topTAFade')
    else divTA.classList.add('topTAFade')
    if (textArea.scrollTop + textArea.clientHeight >= textArea.scrollHeight) divTA.classList.remove('bottomTAFade')
    else divTA.classList.add('bottomTAFade')
  }
</script>

<div class="textArea" bind:this={divTA} style={width ? 'width: ' + width : ''}>
  <textarea
    class:nolabel={!label}
    {id}
    rows={lines}
    bind:value
    on:keyup
    placeholder=" "
    bind:this={textArea}
    on:scroll={scroll}
  />
  {#if label}
    <div class="label"><Label {label} /></div>
  {/if}
</div>

<style lang="scss">
  .textArea {
    position: relative;
    display: flex;
    flex-direction: column;
    padding: 0;
    font-family: inherit;
    min-width: 50px;
    min-height: 106px;
    background-color: var(--theme-bg-accent-color);
    border: 1px solid var(--theme-bg-accent-hover);
    border-radius: 12px;
    &:focus-within {
      background-color: var(--theme-bg-focused-color);
      border-color: var(--theme-bg-focused-border);
    }
    textarea {
      overflow-y: scroll;
      position: relative;
      height: 70px;
      margin: 0;
      margin: 26px 20px 0;
      padding: 0px;
      font-family: inherit;
      font-size: 14px;
      line-height: 17px;
      color: var(--theme-caption-color);
      background-color: transparent;
      outline: none;
      border: none;
      resize: none;
    }
    .nolabel {
      padding-top: 0;
    }

    .label {
      position: absolute;
      top: 18px;
      left: 20px;
      font-size: 12px;
      line-height: 14px;
      color: var(--theme-caption-color);
      pointer-events: none;
      opacity: 0.3;
      transition: all 200ms;
      user-select: none;
    }
    textarea:focus + .label,
    textarea:not(:placeholder-shown) + .label {
      top: 10px;
    }
  }

  :global(.topTAFade::before),
  :global(.bottomTAFade::after) {
    content: '';
    position: absolute;
    left: 20px;
    width: calc(100% - 40px);
    height: 20px;
    background-color: var(--theme-button-bg-enabled);
    pointer-events: none;
  }
  :global(.topTAFade:focus-within::before),
  :global(.bottomTAFade:focus-within::after) {
    background-color: var(--theme-button-bg-focused);
  }
  :global(.topTAFade::before) {
    top: 24px;
    z-index: 15;
    mask-image: linear-gradient(0deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 100%);
  }
  :global(.bottomTAFade::after) {
    bottom: 6px;
    z-index: 15;
    mask-image: linear-gradient(0deg, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 100%);
  }
</style>
