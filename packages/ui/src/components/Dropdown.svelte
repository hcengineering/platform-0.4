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
  import { createEventDispatcher } from 'svelte'
  import type { IntlString, Asset, UIComponent } from '@anticrm/status'

  import ui from '../component'
  import { showPopup } from '..'
  import type { DropdownItem } from '../types'
  import DropdownPopup from './popups/DropdownPopup.svelte'

  import ArrowDown from './icons/Down.svelte'
  import Label from './Label.svelte'
  import Icon from './Icon.svelte'

  export let icon: Asset | UIComponent = ArrowDown
  export let label: IntlString | undefined
  export let items: DropdownItem[]
  export let selected: DropdownItem['id'] | undefined

  const dispatch = createEventDispatcher()
  let btn: HTMLElement

  let isNull = false
  $: isNull = items.length === 0

  let selectedItem = items.find((x) => x.id === selected)
  $: selectedItem = items.find((x) => x.id === selected)
  $: if (selected === undefined && items[0] !== undefined) {
    selected = items[0].id
  }
</script>

<div
  bind:this={btn}
  class="flex-col cursor-pointer"
  on:click={(ev) => {
    showPopup(DropdownPopup, { items, selected }, btn, (result) => {
      // undefined passed when closed without changes, null passed when unselect
      if (result !== undefined && result !== selected) {
        selected = result
        dispatch('change', selected)
      }
    })
  }}
>
  {#if label}<div class="label"><Label {label} /></div>{/if}
  <div class="flex-row-center">
    <div class="icon {!selectedItem?.label || isNull ? 'content-trans-color' : 'caption-color'}">
      {#if typeof icon === 'string'}
        <Icon {icon} size={16} fill={'currentColor'} />
      {:else}
        <svelte:component this={icon} size={16} fill={'currentColor'} />
      {/if}
    </div>
    <div class={!selectedItem?.label || isNull ? 'content-trans-color' : 'caption-color'}>
      {#if selectedItem?.label !== undefined}
        <Label label={selectedItem.label} />
      {:else}
        <Label label={ui.string.None} />
      {/if}
    </div>
  </div>
</div>

<style lang="scss">
  .label {
    font-weight: 500;
    font-size: .75rem;
    color: var(--theme-content-accent-color);
  }
  .icon { margin-right: .25rem; }
</style>
