<!--
// Copyright © 2020, 2021 Anticrm Platform Contributors.
// Copyright © 2021 Hardcore Engineering Inc.
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
  import Component from './Component.svelte'
  import { UIComponent } from '@anticrm/status'
  import type { PopupAlignment } from '../types'
  import { closePopup } from '..'

  export let is: UIComponent
  export let props: object
  export let element: PopupAlignment | undefined
  export let onClose: ((result: any) => void) | undefined
  export let zIndex: number

  let modalHTML: HTMLElement
  let modalOHTML: HTMLElement
  let showOverlay: boolean = false
  let scrollable: boolean = false

  function close (result: any) {
    if (onClose !== undefined) onClose(result)
    closePopup()
  }

  $: {
    if (modalHTML) {
      if (element) {
        scrollable = false
        modalHTML.style.height = 'auto'
        if (typeof element !== 'string') {
          const rect = element.getBoundingClientRect()
          const rectPopup = modalHTML.getBoundingClientRect()
          if (rect.bottom + rectPopup.height + 28 < document.body.clientHeight) {
            modalHTML.style.top = `calc(${rect.bottom}px + 12px)`
          } else if (rect.top > document.body.clientHeight - rect.bottom) {
            modalHTML.style.bottom = `calc(${document.body.clientHeight - rect.y}px + 12px)`
            if (rectPopup.height > rect.top - 28) {
              modalHTML.style.top = '16px'
              modalHTML.style.height = rect.top - 28 + 'px'
              scrollable = true
            }
          } else {
            modalHTML.style.top = `calc(${rect.bottom}px + 12px)`
            if (rectPopup.height > document.body.clientHeight - rect.bottom - 28) {
              modalHTML.style.bottom = '16px'
              modalHTML.style.height = document.body.clientHeight - rect.bottom - 28 + 'px'
              scrollable = true
            }
          }
          if (rect.left + rectPopup.width + 16 > document.body.clientWidth) {
            modalHTML.style.right = '16px'
          } else {
            modalHTML.style.left = rect.left + 'px'
          }
        } else if (element === 'right') {
          modalHTML.style.top = '32px'
          modalHTML.style.bottom = '20px'
          modalHTML.style.right = '20px'
          showOverlay = true
        }
      } else {
        modalHTML.style.top = '50%'
        modalHTML.style.left = '50%'
        modalHTML.style.transform = 'translate(-50%, -50%)'
        showOverlay = true
      }
    }
  }
</script>

<div class="popup" bind:this={modalHTML} style={`z-index: ${zIndex + 1};`}>
  {#if typeof is === 'string'}
    <Component {is} {props} {scrollable} on:close={(ev) => close(ev.detail)} />
  {:else}
    <svelte:component this={is} {...props} {scrollable} on:close={(ev) => close(ev.detail)} />
  {/if}
</div>
<div
  bind:this={modalOHTML}
  class="modal-overlay"
  class:showOverlay
  style={`z-index: ${zIndex};`}
  on:click={() => close(undefined)}
/>

<style lang="scss">
  .popup {
    position: fixed;
    background-color: transparent;
  }
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    &.showOverlay {
      background-color: rgba(0, 0, 0, 0.5);
    }
  }
</style>
