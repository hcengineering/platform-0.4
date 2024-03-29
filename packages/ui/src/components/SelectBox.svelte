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
  import type { IntlString, UIComponent } from '@anticrm/status'
  import type { IPopupItem } from '../types'
  import Add from './icons/Add.svelte'
  import Close from './icons/Close.svelte'
  import Search from './icons/Search.svelte'
  import PopupItem from './PopupItem.svelte'
  import PopupMenu from './PopupMenu.svelte'
  import SelectItem from './SelectItem.svelte'
  import EditWithIcon from './EditWithIcon.svelte'
  import ui from '../component'
  import { translate } from '@anticrm/platform'

  export let component: UIComponent | undefined = undefined
  export let items: Array<IPopupItem>
  export let vAlign: 'top' | 'middle' | 'bottom' = 'bottom'
  export let hAlign: 'left' | 'center' | 'right' = 'left'
  export let margin: number = 16
  export let gap: number = 8
  export let removeLabel: IntlString | undefined = undefined
  export let searchLabel: IntlString | undefined = undefined
  export let showSearch = true

  const byTitle: boolean = !component
  let pressed: boolean = false
  let count: number
  let search: string = ''

  $: count = items.filter((i) => i.selected).length

  function searchItem (i: IPopupItem, search: string): boolean {
    const lowerSearch = search.toLowerCase()
    if (i.matcher !== undefined) {
      return !i.selected && i.matcher(lowerSearch)
    }
    return !i.selected && i.title?.toLowerCase().indexOf(lowerSearch) !== -1
  }
</script>

<div class="selectBox" style="padding: {gap / 2}px;">
  {#each items.filter((i) => i.selected) as complate}
    <SelectItem bind:item={complate} bind:component bind:items {vAlign} {hAlign} {margin} {gap} {removeLabel} />
  {/each}
  {#if items.filter((i) => !i.selected).length}
    <PopupMenu {margin} bind:show={pressed} bind:title={searchLabel} bind:showHeader={showSearch}>
      <button
        slot="trigger"
        class="btn"
        style="margin: {gap / 2}px"
        class:selected={pressed}
        on:click={(event) => {
          pressed = !pressed
          event.stopPropagation()
        }}
      >
        <div class="icon">
          {#if pressed}<Close size={16} />{:else}<Add size={16} />{/if}
        </div>
      </button>
      <div slot="header" class="search">
        {#await translate(ui.string.Search, {}) then searchValue}
          <EditWithIcon icon={Search} placeholder={searchValue} bind:value={search} />
        {/await}
      </div>
      {#each items.filter((i) => searchItem(i, search)) as item}
        {#if byTitle}
          <PopupItem
            title={item.title}
            selectable
            bind:selected={item.selected}
            action={() => {
              item.action?.()
              pressed = !pressed
            }}
          />
        {:else}
          <PopupItem
            {component}
            props={item.props}
            selectable
            bind:selected={item.selected}
            action={() => {
              item.action?.()
              pressed = !pressed
            }}
          />
        {/if}
      {/each}
    </PopupMenu>
  {/if}
</div>

<style lang="scss">
  .selectBox {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    width: auto;
    background-color: var(--theme-button-bg-enabled);
    border: 1px solid var(--theme-bg-accent-color);
    border-radius: 12px;

    .btn {
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 0;
      padding: 0;
      width: 40px;
      height: 40px;
      background-color: transparent;
      border: 1px solid transparent;
      border-radius: 12px;
      outline: none;
      cursor: pointer;

      .icon {
        width: 16px;
        height: 16px;
        opacity: 0.3;
      }

      &.selected {
        background-color: var(--theme-button-bg-focused);
        border: 1px solid var(--theme-bg-accent-color);
        .icon {
          opacity: 0.6;
        }
      }

      &:hover {
        background-color: var(--theme-button-bg-pressed);
        border: 1px solid var(--theme-bg-accent-color);
        .icon {
          opacity: 1;
        }
      }
      &:focus {
        border: 1px solid var(--primary-button-focused-border);
        box-shadow: 0 0 0 3px var(--primary-button-outline);
        .icon {
          opacity: 1;
        }
      }
    }
  }
</style>
