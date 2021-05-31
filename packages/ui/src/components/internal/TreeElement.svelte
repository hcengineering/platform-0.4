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
  import Collapsed from './icons/Collapsed.svelte'
  import Expanded from './icons/Expanded.svelte'
  import type { Asset } from '@anticrm/status'

  import Icon from '../Icon.svelte'

  export let icon: Asset | undefined = undefined
  // export let avatar: Any
  export let title: string
  export let notifications = 0
  export let node = false
  export let collapsed = false

  function actionApp(): void {
    console.log('Click')
  }
</script>

<div class="container">
  <div class="title" class:sub={!node} on:click={() => {if (node && !icon) collapsed = !collapsed; else actionApp()}}>
    <div class="icon" class:sub={!node}>
      {#if icon}
        <Icon {icon} size="16px"/>
      {:else}
        {#if collapsed}<Collapsed/>{:else}<Expanded/>{/if}
      {/if}
    </div>
    <span>{title}</span>
    {#if notifications > 0 && collapsed}
      <div class="counter">{notifications}</div>
    {/if}
  </div>
</div>
{#if node && !icon}
  <div class="dropdown" class:collapsed={collapsed}>
    <slot/>
  </div>
{/if}

<style lang="scss">
  .container {
    height: 36px;
    .title {
      display: flex;
      align-items: center;
      margin: 0 10px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      color: var(--theme-caption-color);
      user-select: none;
      cursor: pointer;
      &.sub {
        font-weight: 400;
        color: var(--theme-content-color);
      }
      .icon {
        width: 16px;
        min-width: 16px;
        height: 16px;
        margin: 10px 16px 10px 18px;
        border-radius: 4px;
        opacity: .3;
        &.sub {
          margin: 10px 16px 10px 50px;
        }
      }
      // .avatar {
      //   width: 24px;
      //   min-width: 24px;
      //   height: 24px;
      //   margin: 6px 8px 6px 50px;
      //   border-radius: 50%;
      //   background-color: var(--theme-bg-selection);
      // }
      span {
        flex-grow: 1;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
      .counter {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 24px;
        min-width: 24px;
        height: 24px;
        border-radius: 50%;
        margin: 6px 10px;
        background-color: #DA5F44;
        font-size: 12px;
        font-weight: 600;
        color: #fff;
      }
      &:hover {
        background-color: var(--theme-button-bg-enabled);
      }
    }
  }
  .dropdown {
    visibility: visible;
    height: auto;
    width: 100%;
    margin-bottom: 20px;
    &.collapsed {
      visibility: hidden;
      height: 0;
      margin-bottom: 8px;
    }
  }
</style>