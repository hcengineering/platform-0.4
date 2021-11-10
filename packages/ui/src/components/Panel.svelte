<!--
// Copyright © 2020, 2021 Anticrm Platform Contributors.
// Copyright © 2021 Hardcore Engineering Inc.
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
  import type { UIComponent, Asset } from '@anticrm/status'
  import Grid from './Grid.svelte'
  import ScrollBox from './ScrollBox.svelte'
  import Icon from './Icon.svelte'

  import Close from './icons/Close.svelte'
  import ExpandWin from './icons/ExpandWin.svelte'
  import CollapseWin from './icons/CollapseWin.svelte'
  import Activity from './icons/Activity.svelte'

  export let title: string | undefined
  export let icon: Asset | UIComponent | undefined
  export let fullSize: boolean = false
  // export let object: any

  const dispatch = createEventDispatcher()
</script>

<div
  class="overlay"
  on:click={() => {
    dispatch('close')
  }}
/>
<div class="dialog-container" class:fullSize>
  {#if fullSize}
    <div class="leftSection">
      <div class="flex-row-center header">
        {#if icon}
          <div class="icon">
            <Icon {icon} size={16} />
          </div>
        {/if}
        {#if title}
          <div class="title">{title}</div>
        {/if}
        {#if $$slots.header}
          <slot name="header" />
        {/if}
      </div>
      {#if $$slots.actions}
        <div class="action-panel">
          <slot name="actions" />
        </div>
      {/if}
      <div class="flex-col scroll-container">
        <div class="flex-col content">
          <slot />
        </div>
      </div>
    </div>
    <div class="rightSection">
      <div class="flex-row-center header">
        <div class="icon">
          <Activity size={16} />
        </div>
        <div class="title">Activity</div>
      </div>
      <div class="flex-col h-full content">
        <ScrollBox vertical stretch>
          <Grid column={1} rowGap={24}>
            <slot name="activity" />
          </Grid>
        </ScrollBox>
      </div>
      <div class="ref-input">
        <slot name="ref-input" />
      </div>
    </div>
  {:else}
    <div class="unionSection">
      <div class="flex-row-center header">
        {#if icon}
          <div class="icon">
            <Icon {icon} size={16} />
          </div>
        {/if}
        {#if title}
          <div class="title">{title}</div>
        {/if}
        {#if $$slots.header}
          <slot name="header" />
        {/if}
      </div>
      {#if $$slots.actions}
        <div class="action-panel">
          <slot name="actions" />
        </div>
      {/if}
      <ScrollBox vertical stretch noShift>
        <div class="flex-col content">
          <slot />
        </div>
        <div class="flex-row-center activity header">
          <div class="icon"><Activity size={16} /></div>
          <div class="title">Activity</div>
        </div>
        <div class="flex-col activity content">
          <Grid column={1} rowGap={24}>
            <slot name="activity" />
          </Grid>
        </div>
      </ScrollBox>
      <div class="ref-input">
        <slot name="ref-input" />
      </div>
    </div>
  {/if}

  <div class="tools">
    <div
      class="tool"
      on:click={() => {
        fullSize = !fullSize
      }}
    >
      <div class="icon">
        {#if fullSize}<CollapseWin size={16} />{:else}<ExpandWin size={16} />{/if}
      </div>
    </div>
    <div
      class="tool"
      on:click={() => {
        dispatch('close')
      }}
    >
      <div class="icon"><Close size={16} /></div>
    </div>
  </div>
</div>

<style lang="scss">
  .dialog-container {
    overflow: hidden;
    position: fixed;
    top: 32px;
    bottom: 24px;
    right: 24px;
    min-width: 700px;

    display: flex;
    flex-direction: column;
    height: calc(100% - 56px);
    background: rgba(31, 31, 37, 0.7);
    border-radius: 20px;
    box-shadow: 0px 44px 154px rgba(0, 0, 0, 0.75);
    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);

    .action-panel {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
      padding: 0 32px 0 40px;
      height: 72px;
      border-bottom: 1px solid var(--theme-card-divider);
    }

    .header {
      flex-shrink: 0;
      padding: 0 40px;
      height: 72px;
      border-bottom: 1px solid var(--theme-card-divider);

      .icon {
        opacity: 0.6;
      }
      .title {
        flex-grow: 1;
        margin-left: 8px;
        font-weight: 500;
        font-size: 1rem;
        color: var(--theme-caption-color);
        user-select: none;
      }
    }
  }

  .unionSection {
    flex-grow: 1;

    display: flex;
    flex-direction: column;
    height: max-content;

    .content {
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      padding: 24px 40px;
      height: max-content;
      row-gap: 20px;
    }
    .activity {
      background-color: var(--theme-bg-accent-color);
      &.header {
        border-bottom: none;
      }
      &.content {
        flex-grow: 1;
        padding-bottom: 0;
        background-color: var(--theme-bg-accent-color);
      }
    }
  }

  .fullSize {
    flex-direction: row;
    left: 24px;
  }

  .leftSection,
  .rightSection {
    flex-basis: 50%;
    display: flex;
    flex-direction: column;
  }
  .leftSection {
    border-right: 1px solid var(--theme-bg-accent-hover);
    .scroll-container {
      overflow: auto;
      height: 100%;
      padding: 32px 32px 24px;
      .content {
        flex-shrink: 0;
        padding: 8px 8px 0;
        row-gap: 20px;
      }
    }
  }
  .rightSection {
    background-color: transparent;
    .header {
      border-bottom: 1px solid var(--theme-card-divider);
    }
    .content {
      flex-grow: 1;
      padding: 40px 40px 0;
      row-gap: 20px;
      background-color: var(--theme-bg-accent-color);
    }
  }

  .ref-input {
    background-color: var(--theme-bg-accent-color);
    padding: 24px 40px;
  }

  .tools {
    position: absolute;
    display: flex;
    top: 28px;
    right: 32px;

    .tool {
      margin-left: 12px;
      opacity: 0.4;
      cursor: pointer;

      .icon {
        transform-origin: center center;
        transform: scale(0.75);
      }
      &:hover {
        opacity: 1;
      }
    }
  }

  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
</style>
