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
  import type { IntlString, Asset } from '@anticrm/status'
  import { Icon, Tooltip } from '@anticrm/ui'

  export let label: IntlString
  export let icon: Asset
  export let action: () => Promise<void>
  export let selected: boolean
  export let notify: boolean
</script>

<button class="app" class:selected on:click={action}>
  {#if notify}
    <div class="marker" />
  {/if}
  <Tooltip {label} direction="right">
    <div class="flex-center icon" class:noty={notify}>
      <Icon {icon} size={24} />
    </div>
  </Tooltip>
</button>

<style lang="scss">
  .app {
    position: relative;
    min-width: 52px;
    min-height: 52px;
    background-color: transparent;
    border: 1px solid transparent;
    border-radius: 8px;
    outline: none;
    cursor: pointer;

    .marker {
      position: absolute;
      top: 14px;
      right: 14px;
      width: 8px;
      height: 8px;
      background-color: var(--highlight-red);
      border-radius: 50%;
    }
    .icon {
      width: 50px;
      height: 50px;
      opacity: .3;
      &.noty {
        clip-path: url(#notify);
      }
    }
    &:hover .icon { opacity: 1; }
    &:focus {
      border: 1px solid var(--primary-button-focused-border);
      box-shadow: 0 0 0 3px var(--primary-button-outline);
      .icon { opacity: 1; }
    }
    &.selected {
      background-color: var(--theme-menu-selection);
      .icon { opacity: 1; }
    }
  }
</style>
