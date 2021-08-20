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
  import type { Asset, IntlString } from '@anticrm/status'
  import type { Action, AnyComponent } from '@anticrm/ui'
  import { ActionIcon, Component, Icon, Label } from '@anticrm/ui'
  import { createEventDispatcher } from 'svelte'
  import Collapsed from '../icons/Collapsed.svelte'
  import Expanded from '../icons/Expanded.svelte'

  export let component: AnyComponent | undefined = undefined
  export let props: any | undefined = undefined

  export let icon: Asset | undefined = undefined
  export let label: IntlString | undefined = undefined
  export let title: string | undefined = undefined
  export let notifications = 0
  export let node = false
  export let collapsed = false
  export let actions: Action[] = []

  let useIcon = true

  $: if (icon && ((icon as string).startsWith('http') || (icon as string).startsWith('https'))) {
    useIcon = false
  }

  let toolInvisible: boolean = true

  const dispatch = createEventDispatcher()
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div
  class="container"
  on:mouseover={() => {
    toolInvisible = false
  }}
  on:mouseout={() => {
    toolInvisible = true
  }}
  on:click|stopPropagation={() => {
    if (node && !icon) collapsed = !collapsed
    dispatch('click')
  }}
>
  <div class="title" class:sub={!node}>
    {#if component}
      <div class="component" class:sub={!node}>
        <Component is={component} {props} />
      </div>
    {:else}
      <div class="icon" class:sub={!node}>
        {#if icon}
          {#if useIcon}
            <Icon {icon} size={16} />
          {:else}
            <img src={icon} width={16} height={16} alt="Avatar" />
          {/if}
        {:else if collapsed}
          <Collapsed />
        {:else}
          <Expanded />
        {/if}
      </div>
      <span>
        {#if label}<Label {label} />{:else}{title}{/if}
      </span>
    {/if}
    {#each actions as action}
      <div class="tool">
        <ActionIcon
          label={action.label}
          icon={action.icon}
          size={16}
          action={action.action}
          invisible={toolInvisible}
        />
      </div>
    {/each}
    {#if notifications > 0 && collapsed}
      <div class="counter">{notifications}</div>
    {/if}
  </div>
</div>
{#if node && !icon}
  <div class="dropdown" class:collapsed>
    <slot />
  </div>
{/if}

<style lang="scss">
  .container {
    height: 36px;
    cursor: pointer;
    .title {
      display: flex;
      align-items: center;
      margin: 0 10px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      color: var(--theme-caption-color);
      user-select: none;
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
        opacity: 0.3;
        &.sub {
          margin: 10px 16px 10px 50px;
        }
      }
      span {
        flex-grow: 1;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
      .component {
        margin: 10px 16px 10px 18px;
        flex-grow: 1;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        &.sub {
          margin: 10px 16px 10px 50px;
        }
      }
      .tool {
        width: 16px;
        height: 16px;
        margin-left: 12px;
        &:last-child {
          margin-right: 10px;
        }
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
        background-color: #da5f44;
        font-size: 12px;
        font-weight: 600;
        color: #fff;
      }
      &:hover {
        background-color: var(--theme-button-bg-enabled);
        .tool {
          visibility: visible;
        }
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
