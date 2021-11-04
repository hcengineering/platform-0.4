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
  import { afterUpdate, onDestroy } from 'svelte/internal'
  import ui from '../component'
  import Label from './Label.svelte'

  export let title: IntlString | undefined = undefined
  export let caption: IntlString | undefined = undefined
  export let margin: number = 16
  export let showHeader: boolean = false
  export let show: boolean
  export let auto: boolean = false

  let trigger: HTMLElement
  let popup: HTMLElement
  let scrolling: boolean
  let elScroll: Node

  afterUpdate(() => {
    if (show) showPopup()
    else hidePopup()
  })

  const showPopup = (): void => {
    fitPopup()
    popup.style.visibility = 'visible'
    elScroll = findNode(trigger, 'scrollBox')
    if (elScroll) elScroll.addEventListener('scroll', startScroll)
  }
  const hidePopup = (): void => {
    if (popup) {
      popup.style.visibility = 'hidden'
      popup.style.maxHeight = ''
    }
    if (elScroll) elScroll.removeEventListener('scroll', startScroll)
  }

  const fitPopup = (): void => {
    const rectT = trigger.getBoundingClientRect()
    const rectP = popup.getBoundingClientRect()
    scrolling = false
    if (rectT.top > document.body.clientHeight - rectT.bottom) {
      // Up
      if (rectT.top - 20 - margin < rectP.height) {
        scrolling = true
        popup.style.maxHeight = `${rectT.top - margin - 20}px`
        popup.style.top = '20px'
      } else popup.style.top = `${rectT.top - rectP.height - margin}px`
    } else {
      // Down
      if (rectT.bottom + rectP.height + 20 + margin > document.body.clientHeight) {
        scrolling = true
        popup.style.maxHeight = `${document.body.clientHeight - rectT.bottom - margin - 20}px`
      }
      popup.style.top = `${rectT.bottom + margin}px`
    }
    if (rectT.left + rectP.width + 20 > document.body.clientWidth) {
      popup.style.left = `${document.body.clientWidth - rectP.width - 20}px`
    } else popup.style.left = `${rectT.left}px`
  }

  const findNode = (el: Node, name: string): any => {
    while (el.parentNode !== null) {
      if (el.classList.contains(name)) return el
      el = el.parentNode
    }
    return false
  }
  const waitClick = (event: any): void => {
    event.stopPropagation()
    if (show) {
      if (!findNode(event.target, 'popup')) show = false
    }
  }
  const startScroll = (): void => {
    show = false
  }

  onDestroy(() => {
    if (elScroll) elScroll.removeEventListener('scroll', startScroll)
  })
</script>

<svelte:window on:mouseup={waitClick} on:resize={startScroll} />

<div class="popup-menu">
  <div
    bind:this={trigger}
    class="trigger"
    on:click={() => {
      if (auto) {
        show = !show
      }
    }}
  >
    <slot name="trigger" />
  </div>
  <div class="popup" bind:this={popup}>
    {#if showHeader}
      <div class="header">
        <div class="title"><Label label={title ?? ui.string.Undefined} /></div>
        <slot name="header" />
        {#if caption}<div class="caption">{caption}</div>{/if}
      </div>
    {/if}
    {#if show}
      <div class="content" class:scrolling><slot /></div>
    {/if}
  </div>
</div>

<style lang="scss">
  .popup-menu {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;

    .popup {
      box-sizing: border-box;
      position: fixed;
      visibility: hidden;
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

      .header {
        text-align: left;
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

        &.scrolling {
          overflow-y: auto;
        }
      }
    }
  }
</style>
