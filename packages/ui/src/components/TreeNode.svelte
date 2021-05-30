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
  import Collapsed from './internal/icons/Collapsed.svelte'
  import Expanded from './internal/icons/Expanded.svelte'

  export let title: string
  export let notifications = 0
  export let collapsed = false
</script>

<div class="container" class:collapsed={collapsed}>
  <div class="title" on:click={() => {collapsed = !collapsed}}>
    <div class="icon">
      {#if collapsed}<Collapsed/>{:else}<Expanded/>{/if}
    </div>
    <span>{title}</span>
    {#if notifications > 0}
      <div class="counter">{notifications}</div>
    {/if}
  </div>
</div>
{#if !collapsed}
  <div class="dropdown">
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
      .icon {
        width: 16px;
        min-width: 16px;
        height: 16px;
        margin: 10px 16px 10px 18px;
        border-radius: 4px;
        opacity: .3;
      }
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
  .collapsed {
    margin-bottom: 8px;
  }
  .dropdown {
    width: 100%;
    margin-bottom: 20px;
  }
</style>