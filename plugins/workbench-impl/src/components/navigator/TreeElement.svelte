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
  import type { Action } from '@anticrm/ui'
  import type { AnyComponent } from '@anticrm/status'
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
  export let changed = false
  export let node = false
  export let collapsed = false
  export let actions: Action[] = []
  export let topic = false

  let useIcon = true

  $: if (icon && ((icon as string).startsWith('http') || (icon as string).startsWith('https'))) {
    useIcon = false
  }

  const dispatch = createEventDispatcher()
  let mouseOver = false
  let noOver = false
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div
  class="flex-row-center container"
  class:topic_container={topic}
  class:sub={!node}
  class:changed
  class:mouseOver
  on:click|stopPropagation={() => {
    if (node && !icon) collapsed = !collapsed
    dispatch('click')
  }}
  on:mouseover={() => {
    mouseOver = true
  }}
  on:mouseleave={() => {
    if (!noOver) {
      mouseOver = false
    }
  }}
>
  {#if component}
    <div class="component">
      <Component is={component} {props} />
    </div>
  {:else}
    <div class="icon">
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
    <span class:topic>
      {#if label}<Label {label} />{:else}{title}{/if}
    </span>
  {/if}
  {#each actions as action}
    <div class:tool_mouseOver={mouseOver} class="tool">
      <ActionIcon
        label={action.label}
        icon={action.icon}
        size={16}
        action={(ev) => {
          noOver = true
          action.action(ev).then(() => {
            mouseOver = false
            noOver = false
          })
        }}
      />
    </div>
  {/each}
  {#if notifications > 0 && collapsed}
    <div class="counter">{notifications}</div>
  {/if}
</div>
{#if node && !icon}
  <div class="dropdown" class:collapsed>
    <slot />
  </div>
{/if}

<style lang="scss">
  .mouseOver {
    background-color: var(--theme-button-bg-enabled);
  }
  .container {
    margin: 0 16px;
    padding-left: 10px;
    padding-right: 12px;
    font-weight: 500;
    color: var(--theme-caption-color);
    border-radius: 8px;
    user-select: none;
    cursor: pointer;
    min-height: 36px;

    &.sub {
      padding-left: 44px;
      font-weight: 400;
      color: var(--theme-content-color);
      .icon {
        margin-right: 8px;
      }
    }

    &.changed {
      font-weight: 900;
      color: var(--theme-caption-color);
    }

    .icon {
      margin-right: 18px;
      width: 16px;
      min-width: 16px;
      height: 16px;
      border-radius: 4px;
      opacity: 0.3;
    }
    span {
      flex-grow: 1;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;

      font-style: normal;
      font-size: 14px;
      line-height: 18px;
    }
    .topic {
      font-style: normal;
      font-weight: 500;
      font-size: 14px;
      line-height: 18px;
    }
    .component {
      flex-grow: 1;
      overflow: hidden;
    }
    .tool {
      margin-left: 2px;
      padding: 4px;
      visibility: hidden;
    }
    .counter {
      margin-left: 12px;
      font-weight: 600;
      font-size: 12px;
      line-height: 100%;
    }

    .tool_mouseOver {
      visibility: visible;
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
  .topic_container {
    min-height: 36px;
  }
</style>
