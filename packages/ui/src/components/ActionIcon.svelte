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
  import type { IntlString, Asset, UIComponent } from '@anticrm/status'
  import type { TooltipAligment } from '..'

  import Icon from './Icon.svelte'
  import Tooltip from './Tooltip.svelte'

  export let label: IntlString
  export let direction: TooltipAligment
  export let icon: Asset | UIComponent
  export let padding: number = 0
  export let filled: boolean = false
  export let size: 16 | 20 | 24
  export let action: (ev?: Event) => void = () => {}
  export let invisible: boolean = false
</script>

<Tooltip {label} {direction}>
  <button class="button" style="padding: {padding}px" on:click|stopPropagation={action}>
    <div class="icon" style="width: {size}px; height: {size}px;" class:invisible>
      {#if typeof icon === 'string'}
        <Icon {icon} {size} />
      {:else}
        <svelte:component this={icon} {size} {filled} />
      {/if}
    </div>
  </button>
</Tooltip>

<style lang="scss">
  .button {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0;
    border: 1px solid transparent;
    border-radius: 4px;
    outline: none;
    background-color: transparent;
    cursor: pointer;

    .icon {
      opacity: 0.3;
      &.invisible {
        opacity: 0;
      }
    }
    &:hover .icon {
      opacity: 1;
    }
    &:focus {
      border: 1px solid var(--primary-button-focused-border);
      box-shadow: 0 0 0 3px var(--primary-button-outline);
      .icon {
        opacity: 1;
      }
    }
  }
</style>
