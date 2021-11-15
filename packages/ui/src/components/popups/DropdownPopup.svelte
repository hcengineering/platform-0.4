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
  import { createEventDispatcher } from 'svelte'
  import { UIComponent } from '@anticrm/status'
  import type { DropdownItem } from '../../types'
  import PopupItem from '../PopupItem.svelte'
  import Label from '../Label.svelte'

  export let items: DropdownItem[]
  export let selected: DropdownItem['id'] | undefined
  export let maxHeight: number = 0
  export let component: UIComponent | undefined = undefined

  const dispatch = createEventDispatcher()
  $: selectedItem = selected === undefined ? undefined : items.find((x) => x.id === selected)
</script>

<div class="flex-col dropdown-popup" style="max-height: {maxHeight ? maxHeight + 'px' : 'max-content'}">
  <div class="flex-grow scroll">
    <div class="flex-col h-full box">
      {#if selectedItem}
        <PopupItem
          component={component || Label}
          props={selectedItem.props || { label: selectedItem.label }}
          selectable
          selected
          action={() => {
            selected = undefined
            dispatch('close', selected)
          }}
        />
      {/if}
      {#each items.filter((x) => x.id !== selected) as item}
        <PopupItem
          component={component || Label}
          props={item.props || { label: item.label }}
          selectable
          action={() => {
            selected = item.id
            dispatch('close', selected)
          }}
        />
      {/each}
    </div>
  </div>
</div>

<style lang="scss">
  .dropdown-popup {
    margin-right: 7px;
    padding: 12px 1px 12px 8px;
    height: min-content;
    background-color: var(--theme-popup-bg);
    border: var(--theme-popup-border);
    border-radius: 20px;
    box-shadow: var(--theme-popup-shadow);
    -webkit-backdrop-filter: blur(30px);
    backdrop-filter: blur(30px);

    .scroll {
      overflow-y: scroll;
      .box {
        margin-right: 1px;
      }
    }
  }
</style>
