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
  import { tooltipstore as tooltip, closeTooltip } from '..'
  import type { TooltipAligment } from '..'
  import Label from './Label.svelte'

  let tooltipHTML: HTMLElement
  let dir: TooltipAligment
  let rect: DOMRect
  let tooltipSW: boolean // tooltipSW = true - Label; false - Component

  $: tooltipSW = !$tooltip.component
  $: {
    if (($tooltip.label || $tooltip.component) && tooltipHTML) {
      if ($tooltip.element) {
        rect = $tooltip.element.getBoundingClientRect()
        const doc = document.body.getBoundingClientRect()

        if ($tooltip.component) {
          if (rect.bottom + tooltipHTML.clientHeight + 28 < doc.height) {
            tooltipHTML.style.top = `calc(${rect.bottom}px + .75rem)`
            dir = 'bottom'
          } else if (rect.top > doc.height - rect.bottom) {
            tooltipHTML.style.bottom = `calc(${doc.height - rect.y}px + .75rem)`
            if (tooltipHTML.clientHeight > rect.top - 28) {
              tooltipHTML.style.top = '1rem'
              tooltipHTML.style.height = rect.top - 28 + 'px'
            }
            dir = 'top'
          } else {
            tooltipHTML.style.top = `calc(${rect.bottom}px + .75rem)`
            if (tooltipHTML.clientHeight > doc.height - rect.bottom - 28) {
              tooltipHTML.style.bottom = '1rem'
              tooltipHTML.style.height = doc.height - rect.bottom - 28 + 'px'
            }
            dir = 'bottom'
          }
          if (rect.left + tooltipHTML.clientWidth + 16 > doc.width) {
            tooltipHTML.style.left = ''
            tooltipHTML.style.right = doc.width - rect.right + 'px'
          } else {
            tooltipHTML.style.left = rect.left + 'px'
            tooltipHTML.style.right = ''
          }
        } else {
          if (!$tooltip.direction) {
            if (rect.right < doc.width / 5) dir = 'right'
            else if (rect.left > doc.width - doc.width / 5) dir = 'left'
            else if (rect.top < tooltipHTML.clientHeight) dir = 'bottom'
            else dir = 'top'
          } else dir = $tooltip.direction

          if (dir === 'right') {
            tooltipHTML.style.top = rect.y + rect.height / 2 + 'px'
            tooltipHTML.style.left = `calc(${rect.right}px + .75rem)`
            tooltipHTML.style.transform = 'translateY(-50%)'
          } else if (dir === 'left') {
            tooltipHTML.style.top = rect.y + rect.height / 2 + 'px'
            tooltipHTML.style.right = `calc(${doc.width - rect.x}px + .75rem)`
            tooltipHTML.style.transform = 'translateY(-50%)'
          } else if (dir === 'bottom') {
            tooltipHTML.style.top = `calc(${rect.bottom}px + .5rem)`
            tooltipHTML.style.left = rect.x + rect.width / 2 + 'px'
            tooltipHTML.style.transform = 'translateX(-50%)'
          } else if (dir === 'top') {
            tooltipHTML.style.bottom = `calc(${doc.height - rect.y}px + .75rem)`
            tooltipHTML.style.left = rect.x + rect.width / 2 + 'px'
            tooltipHTML.style.transform = 'translateX(-50%)'
          }
          tooltipHTML.classList.remove('no-arrow')
        }
      } else {
        tooltipHTML.style.top = '50%'
        tooltipHTML.style.left = '50%'
        tooltipHTML.style.width = 'min-content'
        tooltipHTML.style.height = 'min-content'
        tooltipHTML.style.transform = 'translate(-50%, -50%)'
        tooltipHTML.classList.add('no-arrow')
      }
      tooltipHTML.style.visibility = 'visible'
    } else if (tooltipHTML) tooltipHTML.style.visibility = 'hidden'
  }

  const hideTooltip = (): void => {
    tooltipHTML.style.visibility = 'hidden'
    closeTooltip()
  }

  const whileShow = (ev: MouseEvent): void => {
    if ($tooltip.element && tooltipHTML) {
      const rectP = tooltipHTML.getBoundingClientRect()
      const dT: number = dir === 'bottom' ? 12 : 0
      const dB: number = dir === 'top' ? 12 : 0
      const inTrigger: boolean = ev.x >= rect.left && ev.x <= rect.right && ev.y >= rect.top && ev.y <= rect.bottom
      const inPopup: boolean =
        ev.x >= rectP.left && ev.x <= rectP.right && ev.y >= rectP.top - dT && ev.y <= rectP.bottom + dB
      if (tooltipSW) {
        if (!inTrigger) hideTooltip()
      } else {
        if (!(inTrigger || inPopup)) hideTooltip()
      }
    }
  }

  function close (result: any) {
    if ($tooltip.onClose !== undefined) $tooltip.onClose(result)
    closeTooltip()
  }
</script>

<svelte:window
  on:mousemove={(ev) => {
    whileShow(ev)
  }}
/>
{#if $tooltip.component}
  <div class="popup" bind:this={tooltipHTML}>
    {#if $tooltip.label}<div class="header"><Label label={$tooltip.label} /></div>{/if}
    <svelte:component this={$tooltip.component} {...$tooltip.props} on:close={(ev) => close(ev.detail)} />
  </div>
{:else if $tooltip.label}
  <div class="tooltip {dir}" bind:this={tooltipHTML}>
    <Label label={$tooltip.label} />
  </div>
{/if}

<style lang="scss">
  .header {
    margin-bottom: 1rem;
    font-weight: 500;
    font-size: 1rem;
    color: var(--theme-caption-color);
  }

  .popup {
    position: fixed;
    display: flex;
    flex-direction: column;
    padding: 1rem;
    color: var(--theme-caption-color);
    background-color: var(--theme-button-bg-hovered);
    border: 1px solid var(--theme-button-border-enabled);
    border-radius: 0.75rem;
    user-select: none;
    filter: drop-shadow(0 1.5rem 4rem rgba(0, 0, 0, 0.35));
    z-index: 1000;
  }

  .tooltip {
    position: fixed;
    padding: 0.5rem;
    color: var(--theme-caption-color);
    background-color: var(--theme-tooltip-color);
    border: 1px solid var(--theme-bg-accent-color);
    border-radius: 0.5rem;
    user-select: none;
    text-align: center;
    z-index: 1000;

    &::after {
      content: '';
      position: absolute;
      width: 0.875rem;
      height: 0.875rem;
      background-color: var(--theme-tooltip-color);
      border: 1px solid var(--theme-bg-accent-color);
      border-radius: 0 0 3px;
      clip-path: polygon(100% 25%, 100% 100%, 25% 100%);
    }

    &.top::after,
    &.bottom::after {
      left: 50%;
      margin-left: -0.5rem;
    }
    &.top {
      bottom: 100%;
      box-shadow: 0px 8px 20px rgba(0, 0, 0, 0.35);
      &::after {
        bottom: -0.3125rem;
        transform: rotate(45deg);
      }
    }
    &.bottom {
      top: 100%;
      box-shadow: 0px -8px 20px rgba(0, 0, 0, 0.35);
      &::after {
        top: -0.3125rem;
        transform: rotate(-135deg);
      }
    }

    &.right::after,
    &.left::after {
      top: 50%;
      margin-top: -0.5rem;
    }
    &.right {
      left: 100%;
      box-shadow: -8px 0px 20px rgba(0, 0, 0, 0.35);
      &::after {
        left: -0.3125rem;
        transform: rotate(135deg);
      }
    }
    &.left {
      right: 100%;
      box-shadow: 8px 0px 20px rgba(0, 0, 0, 0.35);
      &::after {
        right: -0.3125rem;
        transform: rotate(-45deg);
      }
    }
  }
  .no-arrow {
    box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.75);
    &::after {
      content: none;
    }
  }
</style>
