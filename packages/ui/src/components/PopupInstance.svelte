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
  import { afterUpdate, onMount } from 'svelte'
  import Component from './Component.svelte'
  import type { AnyComponent, UIComponent } from '@anticrm/status'
  import type { PopupAlignment } from '../types'
  import { closePopup } from '..'
  import { DeferredPromise } from '@anticrm/core'

  export let is: UIComponent | AnyComponent
  export let props: object
  export let element: PopupAlignment | undefined
  export let onClose: ((result: any) => void) | undefined
  export let zIndex: number
  export let bindPromise: DeferredPromise<any>
  export let overrideOverlay: boolean | undefined = undefined

  let modalHTML: HTMLElement
  let modalOHTML: HTMLElement
  let showOverlay: boolean = false
  let maxHeight: number = 0

  function close (result: any) {
    if (onClose !== undefined) onClose(result)
    closePopup()
  }

  const fitPopup = (): void => {
    if (modalHTML) {
      if (element) {
        maxHeight = 0
        showOverlay = overrideOverlay !== undefined ? overrideOverlay : false
        modalHTML.style.left = modalHTML.style.right = modalHTML.style.top = modalHTML.style.bottom = ''
        if (typeof element !== 'string') {
          const rect = element.getBoundingClientRect()
          const rectPopup = modalHTML.getBoundingClientRect()
          if (rect.bottom + rectPopup.height + 28 <= document.body.clientHeight) {
            modalHTML.style.top = `calc(${rect.bottom}px + 12px)`
            maxHeight = document.body.clientHeight - rect.bottom - 28
          } else if (rectPopup.height + 28 < rect.top) {
            modalHTML.style.bottom = `calc(${document.body.clientHeight - rect.y}px + 12px)`
            maxHeight = rect.top - 28
          } else {
            modalHTML.style.top = modalHTML.style.bottom = '16px'
            maxHeight = document.body.clientHeight - 32
          }

          if (rect.left + rectPopup.width + 16 > document.body.clientWidth) {
            modalHTML.style.right = document.body.clientWidth - rect.right + 'px'
          } else {
            modalHTML.style.left = rect.left + 'px'
          }
        } else if (element === 'right') {
          modalHTML.style.top = '32px'
          modalHTML.style.bottom = '20px'
          modalHTML.style.right = '20px'
          showOverlay = overrideOverlay !== undefined ? overrideOverlay : true
        } else if (element === 'float') {
          modalHTML.style.top = '64px'
          modalHTML.style.bottom = '64px'
          modalHTML.style.right = '64px'
        } else if (element === 'full') {
          modalHTML.style.top = '0'
          modalHTML.style.bottom = '0'
          modalHTML.style.left = '0'
          modalHTML.style.right = '0'
          showOverlay = overrideOverlay !== undefined ? overrideOverlay : true
        }
      } else {
        modalHTML.style.top = '50%'
        modalHTML.style.left = '50%'
        modalHTML.style.transform = 'translate(-50%, -50%)'
        showOverlay = overrideOverlay !== undefined ? overrideOverlay : true
      }
    }
  }

  afterUpdate(() => fitPopup())
  onMount(() => {
    if (modalHTML) {
      const resizeObserver = new ResizeObserver(() => fitPopup())
      resizeObserver.observe(modalHTML)
    }
  })
</script>

<svelte:window
  on:resize={fitPopup}
  on:keydown|stopPropagation={(e) => {
    if (e.key === 'Escape') {
      close(undefined)
    }
  }}
/>
<div class="popup" bind:this={modalHTML} style={`z-index: ${zIndex + 1};`}>
  <Component
    {is}
    {props}
    {maxHeight}
    on:close={(ev) => close(ev.detail)}
    on:bindThis={(evt) => {
      bindPromise.resolve(evt.detail)
    }}
  />
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
    display: flex;
    flex-direction: column;
    justify-content: center;
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
