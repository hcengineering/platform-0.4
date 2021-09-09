<!--
// Copyright © 2021 Anticrm Platform Contributors.
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
  import type { IconGroupItem } from '../types'
  import Tooltip from './Tooltip.svelte'

  export let items: Array<IconGroupItem>
  export let selected: string = items[0]?.id ?? ''

  let lastItems = items

  $: {
    if (items.length > 0 && lastItems.length === 0) {
      selected = items[0].id
    }

    lastItems = items
  }
</script>

<div class="root">
  {#each items as item (item.id)}
    <Tooltip label={item.tooltip}>
      <div class="item" class:selected={selected === item.id} on:click={() => (selected = item.id)}>
        <div class="icon" class:selected={selected === item.id}><svelte:component this={item.icon} size={16} /></div>
      </div>
    </Tooltip>
  {/each}
</div>

<style lang="scss">
  .root {
    display: flex;
    flex-direction: row;
    height: 32px;
  }

  .item {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background-color: transparent;
    cursor: pointer;

    &:hover > .icon {
      opacity: 1;
    }

    &.selected {
      background-color: var(--theme-button-bg-enabled);
      cursor: default;
    }
  }

  .icon {
    width: 16px;
    height: 16px;
    opacity: 0.2;

    &.selected {
      opacity: 0.8;
    }
  }
</style>
