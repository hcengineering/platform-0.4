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
  export let vAlign: 'top' | 'middle' | 'bottom' = 'bottom'
  export let hAlign: 'left' | 'center' | 'right' = 'right'
  export let margin: number = 16
  export let show: boolean

  let style: string = ''
  if (vAlign == 'top') style = `transform: translateY(-${margin}px);`
  if (vAlign == 'middle') {
    if (hAlign == 'left') style = `transform: translateX(-${margin}px);`
    if (hAlign == 'right') style = `transform: translateX(${margin}px);`
  }
  if (vAlign == 'bottom') style = `transform: translateY(${margin}px);`

  let opened: boolean = false
  const waitClick = (event: any) => {
    let context: boolean = false
    let startNode: Node = event.target
    while (startNode.parentNode !== null) {
      if (startNode.classList.contains('popup')) context = true
      startNode = startNode.parentNode
    }
    if (!context) {
      window.removeEventListener('mouseup', waitClick)
      show = false
      opened = false
    }
  }
  $: if (show && !opened) {
    window.addEventListener('mouseup', waitClick)
    opened = true
  }
</script>

<div class="popup-menu">
  <div class="trigger"><slot name="trigger"/></div>
  {#if show}
    <div class="popup {vAlign} {hAlign}" style={style}>
      <slot/>
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
      padding: 8px;
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
    }
  }
</style>
