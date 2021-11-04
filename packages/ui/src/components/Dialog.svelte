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

  import Close from './icons/Close.svelte'
  import ScrollBox from './ScrollBox.svelte'
  import Button from './Button.svelte'
  import Label from './Label.svelte'

  import ui from '../component'

  export let label: IntlString
  export let okLabel: IntlString
  export let okDisabled: boolean = false
  export let cancelLabel: IntlString = ui.string.Cancel
  export let withCancel = true
  export let withOk = true
  export let okAction: (() => void) | (() => Promise<void>)
  export let cancelAction: (() => void) | (() => Promise<void>) = () => {}

  const dispatch = createEventDispatcher()
</script>

<svelte:window
  on:keydown={(e) => {
    if (e.key === 'Escape') {
      dispatch('close')
    }
  }}
/>
<div class="dialog-container">
  <div class="dialog-bg" />
  <div class="header">
    <div class="title">
      {#if label}
        <Label {label} />
      {/if}
      <slot name="header" />
    </div>
    <div
      class="tool"
      on:click={() => {
        dispatch('close')
      }}
    >
      <Close size={16} />
    </div>
  </div>
  {#if $$slots.actions}
    <div class="action-panel">
      <slot name="actions" />
    </div>
  {/if}
  <div class="content">
    <ScrollBox vertical><slot /></ScrollBox>
  </div>
  {#if withCancel || withOk}
    <div class="footer">
      {#if withOk}
        <Button
          label={okLabel}
          disabled={okDisabled}
          primary
          on:click={async () => {
            const promise = okAction()
            if (promise instanceof Promise) {
              await promise
            }
            dispatch('close')
          }}
        />
      {/if}
      {#if withCancel}
        <Button
          label={cancelLabel}
          on:click={async () => {
            const promise = cancelAction()
            if (promise instanceof Promise) {
              await promise
            }
            dispatch('close')
          }}
        />
      {/if}
    </div>
  {/if}
</div>

<style lang="scss">
  .dialog-container {
    display: flex;
    flex-direction: column;
    width: auto;
    max-height: 100vh;
    height: calc(100vh - 52px);
    // background-color: var(--theme-bg-color);
    border-radius: 20px;
    box-shadow: 0px 50px 120px rgba(0, 0, 0, 0.4);

    .dialog-bg {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      background-color: var(--theme-dialog-bg);
      border-radius: 20px;
      backdrop-filter: blur(120px);
      -webkit-backdrop-filter: blur(120px);
      box-shadow: var(--theme-dialog-shadow);
      z-index: -1;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
      padding: 0 32px 0 40px;
      height: 72px;
      border-bottom: 1px solid var(--theme-dialog-divider);

      .title {
        flex-grow: 1;
        font-weight: 500;
        font-size: 18px;
        color: var(--theme-caption-color);
        user-select: none;
      }

      .tool {
        width: 16px;
        height: 16px;
        margin-left: 12px;
        opacity: 0.4;
        cursor: pointer;
        &:hover {
          opacity: 1;
        }
      }
    }
    .action-panel {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
      padding: 0 32px 0 40px;
      height: 72px;
      border-bottom: 1px solid var(--theme-dialog-divider);
    }
    .content {
      flex-shrink: 0;
      flex-grow: 1;
      width: 640px;
      margin: 0 40px;
    }

    .footer {
      display: flex;
      overflow: hidden;
      flex-direction: row-reverse;
      align-items: center;
      flex-shrink: 0;
      gap: 12px;
      padding: 0 40px;
      height: 96px;
      mask-image: linear-gradient(90deg, rgba(0, 0, 0, 0) 20px, rgba(0, 0, 0, 1) 40px);
    }
  }
</style>
