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
  import { IntlString, translate } from '@anticrm/platform'
  import type { Account, Ref } from '@anticrm/core'
  import Label from './Label.svelte'
  import EditWithIcon from './EditWithIcon.svelte'
  import PopupItem from './PopupItem.svelte'
  import UserInfo from './UserInfo.svelte'
  import ui from '../component'
  import Search from './icons/Search.svelte'
  import { createEventDispatcher } from 'svelte'

  export let label: IntlString | undefined
  export let selected: Ref<Account> | undefined
  export let users: Account[] = []
  export let showSearch: boolean = false
  export let scrollable: boolean = false

  const dispatch = createEventDispatcher()
  $: selectedItem = selected === undefined ? undefined : users.find((u) => u._id === selected)

  let search: string = ''
</script>

<div class="userbox-popup" class:scrollable>
  <div class="flex-col header">
    {#if label}<div class="title"><Label {label} /></div>{/if}
    {#if showSearch}
      <div class="search">
        {#await translate(ui.string.Search, {}) then searchValue}
          <EditWithIcon icon={Search} placeholder={searchValue} bind:value={search} />
        {/await}
      </div>
    {/if}
    <div class="label">SUGGESTED</div>
  </div>
  <div class="flex-grow scroll">
    <div class="flex-col h-full box">
      {#if selectedItem}
        <PopupItem
          component={UserInfo}
          props={{ user: selectedItem, size: 36 }}
          selectable
          selected
          action={() => {
            selected = undefined
            dispatch('close', selected)
          }}
        />
      {/if}
      {#each users.filter((u) => u._id !== selected && u.name.toLowerCase().indexOf(search.toLowerCase()) !== -1) as user}
        <PopupItem
          component={UserInfo}
          props={{ user: user, size: 36 }}
          selectable
          action={() => {
            selected = user._id
            dispatch('close', selected)
          }}
        />
      {/each}
    </div>
  </div>
</div>

<style lang="scss">
  .userbox-popup {
    display: flex;
    flex-direction: column;
    padding: 8px 8px 12px;
    height: 100%;
    background-color: var(--theme-popup-bg);
    border: var(--theme-popup-border);
    border-radius: 20px;
    box-shadow: var(--theme-popup-shadow);
    backdrop-filter: blur(30px);

    .header {
      display: flex;
      flex-direction: column;
      padding: 8px 8px 0;
      .title {
        margin-bottom: 12px;
        font-weight: 500;
        color: var(--theme-content-accent-color);
      }
      .search { margin-bottom: 8px; }
      .label {
        margin-bottom: 8px;
        text-transform: uppercase;
        font-weight: 600;
        font-size: 12px;
        color: var(--theme-content-trans-color);
      }
    }

    &.scrollable {
      margin-right: 7px;
      padding: 8px 1px 12px 8px;
      .header { margin-right: 6px; }
      .scroll {
        overflow-y: scroll;
        .box { margin-right: 1px; }
      }
    }
  }
</style>
