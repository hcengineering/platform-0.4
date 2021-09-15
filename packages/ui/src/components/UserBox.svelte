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
  import { IntlString } from '@anticrm/platform'
  import type { Account, Ref } from '@anticrm/core'
  import Label from './Label.svelte'
  import UserInfo from './UserInfo.svelte'
  import { showPopup } from '..'
  import UserBoxPopup from './UserBoxPopup.svelte'
  import IconAvatar from './icons/Avatar.svelte'

  export let title: IntlString
  export let label: IntlString
  // export let caption: IntlString | undefined
  export let selected: Ref<Account> | undefined
  export let users: Account[] = []
  export let showSearch: boolean = false

  $: selectedItem = selected === undefined ? undefined : users.find((u) => u._id === selected)
  let btn: HTMLElement
</script>

<div
  class="userbox-container"
  on:click={(ev) => {
    showPopup(UserBoxPopup, { label: title, users, selected, showSearch }, btn, (result) => {
      if (result) selected = result
    })
  }}
>
  <button class="btn" bind:this={btn}>
    {#if selectedItem}
      <UserInfo user={selectedItem} size={36} avatarOnly />
    {:else}
      <IconAvatar />
    {/if}
  </button>
  <div class="selectUser">
    <div class="content-accent-color"><Label label={title} /></div>
    <div class="dotted-text name">
      {#if selectedItem}{selectedItem.email}{:else}<Label {label} />{/if}
    </div>
  </div>
</div>

<style lang="scss">
  .userbox-container {
    display: flex;
    flex-wrap: nowrap;
    cursor: pointer;

    .btn {
      width: 36px;
      height: 36px;
      border: 1px solid var(--theme-bg-focused-color);
      border-radius: 50%;
      &:hover {
        background-color: var(--theme-bg-accent-hover);
      }
      &:active {
        background-color: var(--theme-bg-accent-color);
      }
    }

    .selectUser {
      margin-left: 12px;
    }
  }
</style>
