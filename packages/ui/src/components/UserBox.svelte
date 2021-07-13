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
  import type { IntlString } from '@anticrm/platform'
  import Label from './Label.svelte'
  import PopupMenu from './PopupMenu.svelte'
  import PopupItem from './PopupItem.svelte'
  import UserInfo from './UserInfo.svelte'
  import Add from './icons/Add.svelte'
  import Close from './icons/Close.svelte'

  interface IUser {
    name: string
    title: string
  }

  export let title: IntlString | undefined = 'Assign task'
  export let caption: IntlString | undefined = 'PROJECT MEMBERS'
  export let selected: IUser | undefined = undefined
  export let users: IUser[] = [{ name: 'chen', title: 'Rosamund Chen' },
                               { name: 'tim', title: 'Tim Ferris' },
                               { name: 'elon', title: 'Elon Musk' },
                               { name: 'kathryn', title: 'Kathryn Minshew' }]
  export let vAlign: 'top' | 'middle' | 'bottom' = 'bottom'
  export let hAlign: 'left' | 'center' | 'right' = 'left'
  export let margin: number = 16
  export let showSearch: boolean = false

  let pressed: boolean = false
  let search: string = ''

</script>

<div class="userBox">
  <PopupMenu {vAlign} {hAlign} {margin} bind:show={pressed}
    bind:title={title} bind:caption={caption} bind:search={search} bind:showSearch={showSearch}
  >
    <button slot="trigger" class="btn" class:selected={pressed}
      on:click={(event) => {
        pressed = !pressed
        event.stopPropagation()
      }}
    >
      {#if selected}
        <div class="avatar"><UserInfo user={selected.name} size={36} avatarOnly /></div>
      {:else}
        <div class="icon">{#if pressed}<Close/>{:else}<Add/>{/if}</div>
      {/if}
    </button>
    {#if selected}
      <PopupItem component={UserInfo} props={{user: selected.name}} selectable selected action={async () => {
        selected = undefined
        pressed = !pressed
      }}/>
    {/if}
    {#each users.filter(u => (u !== selected) && (u.title.toLowerCase().indexOf(search.toLowerCase()) !== -1)) as user}
      <PopupItem component={UserInfo} props={{user: user.name}} selectable action={async () => {
        selected = user
        pressed = !pressed
      }}/>
    {/each}
  </PopupMenu>
  <div class="selectUser">
    <div class="title">{title}</div>
    <div class="user">{#if selected}{selected.title}{:else}{title}{/if}</div>
  </div>
</div>

<style lang="scss">
  .userBox {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    width: auto;

    .btn {
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 0;
      padding: 0;
      width: 36px;
      height: 36px;
      background-color: var(--theme-button-bg-focused);
      border: 1px solid transparent;
      border-radius: 50%;
      outline: none;
      cursor: pointer;

      .icon {
        width: 16px;
        height: 16px;
        opacity: .3;
      }

      .avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        opacity: 1;
      }

      &.selected {
        background-color: var(--theme-button-bg-focused);
        border: 1px solid var(--theme-bg-accent-color);
        .icon {
          opacity: .6;
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

    .selectUser {
      margin-left: 12px;
      font-size: 14px;
      .title {
        color: var(--theme-content-color);
      }
      .user {
        color: var(--theme-caption-color);
      }
    }
  }
</style>