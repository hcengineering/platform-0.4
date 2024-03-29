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

  import { createEventDispatcher } from 'svelte'

  import ui from '..'
  import Label from './Label.svelte'
  import Button from './Button.svelte'

  export let label: IntlString
  // export let okLabel: IntlString
  // export let cancelLabel: IntlString
  export let okAction: () => void
  export let canSave: boolean = false

  const dispatch = createEventDispatcher()
</script>

<form class="card-container" on:submit|preventDefault={() => {}}>
  <div class="card-bg" />
  <div class="flex-between header">
    <div class="overflow-label label"><Label {label} /></div>
    {#if $$slots.error}
      <div class="flex-grow error">
        <slot name="error" />
      </div>
    {/if}
  </div>
  <div class="content" class:no-pool={!$$slots.pool}><slot /></div>
  {#if $$slots.pool}
    <div class="flex-col pool">
      <div class="separator" />
      <slot name="pool" />
    </div>
  {/if}
  <div class="footer">
    <Button
      disabled={!canSave}
      label={ui.string.Ok}
      size={'small'}
      transparent
      primary
      on:click={() => {
        okAction()
        dispatch('close')
      }}
    />
    <Button
      label={ui.string.Cancel}
      size={'small'}
      transparent
      on:click={() => {
        dispatch('close')
      }}
    />
  </div>
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
      position: relative;
      flex-shrink: 0;
      padding: 28px;

      .label {
        font-weight: 500;
        font-size: 1rem;
        color: var(--theme-caption-color);
      }

      .error {
        position: absolute;
        display: flex;
        top: 52px;
        left: 28px;
        right: 28px;
        font-weight: 500;
        font-size: 0.75rem;
        color: var(--system-error-color);
        &:empty {
          visibility: hidden;
        }
      }
    }

    .content {
      flex-shrink: 0;
      flex-grow: 1;
      margin: 8px 28px;
      height: fit-content;
      &.no-pool {
        margin-bottom: 12px;
      }
    }

    .pool {
      margin: 0 28px 12px;
      color: var(--theme-caption-color);
      .separator {
        margin: 16px 0;
        height: 1px;
        background-color: var(--theme-card-divider);
      }
    }

    .footer {
      flex-shrink: 0;
      display: grid;
      grid-auto-flow: column;
      direction: rtl;
      justify-content: start;
      align-items: center;
      column-gap: 12px;
      padding: 16px 28px 28px;
      height: 84px;
      mask-image: linear-gradient(90deg, rgba(0, 0, 0, 0) 20px, rgba(0, 0, 0, 1) 40px);
      overflow: hidden;
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
      -webkit-backdrop-filter: blur(120px);
      backdrop-filter: blur(120px);
      box-shadow: var(--theme-card-shadow);
      z-index: -1;
    }
  }
</style>
