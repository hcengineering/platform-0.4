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
  import core, { Account } from '@anticrm/core'
  import { Label, PopupItem, PopupMenu } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import { createEventDispatcher } from 'svelte'
  import avatar from '../../img/avatar.png'

  import workbenchImpl from '../plugin'

  const client = getClient()

  const dispatch = createEventDispatcher()
  let showMenu = false

  async function getUser (): Promise<Account> {
    return (await client.findAll(core.class.Account, { _id: client.accountId() }))[0]
  }
</script>

<div class="profileBox">
  <PopupMenu bind:show={showMenu} title={workbenchImpl.string.Profile} showHeader={true}>
    <button
      slot="trigger"
      class="btn"
      class:selected={showMenu}
      on:click|preventDefault={(event) => {
        showMenu = !showMenu
        event.stopPropagation()
      }}
    >
      <div class="profile">
        {#await getUser()}
          <img class="avatar" src={avatar} alt="Profile" />
        {:then account}
          <img class="avatar" src={account.avatar} alt="Profile" />
        {/await}
      </div>
    </button>
    <PopupItem
      component={Label}
      props={{ label: workbenchImpl.string.Logout }}
      action={() => {
        showMenu = false
        dispatch('logout')
      }}
    />
  </PopupMenu>
</div>

<style lang="scss">
  .profileBox {
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
        opacity: 0.3;
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
