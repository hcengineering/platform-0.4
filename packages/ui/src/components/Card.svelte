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
  import type { IntlString } from '@anticrm/status'

  import { afterUpdate, createEventDispatcher } from 'svelte'

  import Label from './Label.svelte'
  import Button from './Button.svelte'

  export let label: IntlString
  export let okLabel: IntlString
  export let okAction: () => void
  export let canSave: boolean = false

  const dispatch = createEventDispatcher()
  afterUpdate(() => {
    dispatch('update', Date.now())
  })
</script>

<form class="card-container">
  <div class="card-bg" />
  <div class="flex-between header">
    <div class="overflow-label label"><Label {label} /></div>
    <div class="tool">
      <Button
        disabled={!canSave}
        label={okLabel}
        transparent
        size={'small'}
        on:click={() => {
          okAction()
          dispatch('close')
        }}
      />
    </div>
  </div>
  {#if $$slots.error}
    <div class="flex-center error">
      <slot name="error" />
    </div>
  {/if}
  <div class="content" class:no-pool={!$$slots.pool}><slot /></div>
  {#if $$slots.pool}
    <div class="flex-col pool" class:shrink={$$slots.contacts}>
      <div class="separator" />
      <slot name="pool" />
    </div>
  {/if}
  {#if $$slots.contacts}
    <div class="flex-between contacts">
      <slot name="contacts" />
    </div>
  {/if}
</form>

<style lang="scss">
  .card-container {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 320px;
    min-width: 320px;
    max-width: 320px;
    border-radius: 20px;

    .header {
      flex-shrink: 0;
      padding: 16px 20px 16px 28px;
      .label {
        font-weight: 500;
        font-size: 16px;
        color: var(--theme-caption-color);
      }
      .tool {
        margin-left: 12px;
      }
    }

    .error {
      margin-bottom: 16px;
      padding: 12px 0;
      color: var(--system-error-color);
      background-color: var(--theme-card-bg-accent);
      &:empty {
        visibility: hidden;
        margin: 0;
        padding: 0;
      }
    }

    .content {
      flex-shrink: 0;
      flex-grow: 1;
      margin: 12px 28px;
      height: fit-content;
      &.no-pool {
        margin-bottom: 28px;
      }
    }

    .pool {
      margin: 0 28px 24px;
      color: var(--theme-caption-color);
      .separator {
        margin: 16px 0;
        height: 1px;
        background-color: var(--theme-card-divider);
      }
      &.shrink {
        margin: 0 28px 16px;
      }
    }

    .contacts {
      padding: 20px 28px;
      background-color: var(--theme-card-bg-accent);
      border-radius: 0 0 20px 20px;
    }

    .card-bg {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      background-color: var(--theme-card-bg);
      border-radius: 20px;
      backdrop-filter: blur(24px);
      box-shadow: var(--theme-card-shadow);
      z-index: -1;
    }
  }
</style>
