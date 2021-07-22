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
  import ui from '../component'
  import Label from './Label.svelte'

  export let title: IntlString | undefined = undefined
  export let caption: IntlString | undefined = undefined
  export let vAlign: 'top' | 'middle' | 'bottom' = 'bottom'
  export let hAlign: 'left' | 'center' | 'right' = 'right'
  export let margin: number = 16
  export let showHeader: boolean = false
  export let show: boolean
  export let auto: boolean = false

  let style: string = ''
  $: {
    if (vAlign === 'top') style = `transform: translateY(-${margin}px);`
    if (vAlign === 'middle') {
      if (hAlign === 'left') style = `transform: translateX(-${margin}px);`
      if (hAlign === 'right') style = `transform: translateX(${margin}px);`
    }
    if (vAlign === 'bottom') style = `transform: translateY(${margin}px);`
  }
  const waitClick = (event: any) => {
    let context: boolean = false
    let startNode: Node = event.target
    while (startNode.parentNode !== null) {
      if (startNode.classList.contains('popup')) context = true
      startNode = startNode.parentNode
    }
    if (!context) show = false
  }
</script>

<svelte:window on:mouseup={waitClick} />
<div class="popup-menu">
  <div
    class="trigger"
    on:click={() => {
      if (auto) {
        show = !show
      }
    }}
  >
    <slot name="trigger" />
  </div>
  {#if show}
    <div class="popup {vAlign} {hAlign}" {style}>
      {#if showHeader}
        <div class="header">
          <div class="title"><Label label={title ?? ui.string.Undefined} /></div>
          <slot name="header" />
          {#if caption}<div class="caption">{caption}</div>{/if}
        </div>
      {/if}
      <div class="content"><slot /></div>
    </div>
  {/if}
</div>

<style lang="scss">
  .popup-menu {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;

    .popup {
      box-sizing: border-box;
      position: absolute;
      display: flex;
      flex-direction: column;
      padding: 24px 20px;
      color: var(--theme-caption-color);
      background-color: var(--theme-button-bg-hovered);
      border: 1px solid var(--theme-button-border-enabled);
      border-radius: 12px;
      box-shadow: 0px 20px 40px rgba(0, 0, 0, 0.2);
      user-select: none;
      text-align: center;
      z-index: 10;

      &.left {
        right: 0;
        box-shadow: 8px 0px 20px rgba(0, 0, 0, 0.25);
      }
      &.center {
        box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.25);
      }
      &.right {
        left: 0;
        box-shadow: -8px 0px 20px rgba(0, 0, 0, 0.25);
      }

      &.top {
        bottom: 100%;
      }
      &.middle {
        &.left {
          right: 100%;
        }
        &.right {
          left: 100%;
        }
      }
      &.bottom {
        top: 100%;
      }

      .header {
        text-align-last: left;
        .title {
          margin-bottom: 16px;
          font-size: 14px;
          font-weight: 500;
          color: var(--theme-caption-color);
        }
        .caption {
          margin: 24px 0 16px;
          font-size: 12px;
          font-weight: 600;
          line-height: 0.5px;
          text-transform: uppercase;
          color: var(--theme-content-color);
        }
      }
      .content {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
    }
  }
</style>
