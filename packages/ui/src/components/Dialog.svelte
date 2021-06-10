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

  import Close from './internal/icons/Close.svelte'
  import Button from './Button.svelte'
  import Label from './Label.svelte'

  export let label: IntlString
  export let okLabel: IntlString
  export let okAction: () => void

  const dispatch = createEventDispatcher()
</script>

<div class="dialog">
  <div class="header">
    <div class="title"><Label {label}/></div>
    <div class="tool" on:click={() => { dispatch('close') }}><Close size={16}/></div>
  </div>
  <slot/>
  <div class="footer">
    <Button label={okLabel} primary on:click={() => { okAction(); dispatch('close') }}/>
  </div>
</div>

<style lang="scss">
  .dialog {
    display: flex;
    flex-direction: column;
    padding: 48px 40px;
    background-color: var(--theme-bg-modal);
    border: 1px solid var(--theme-border-modal);
    border-radius: 20px;
    box-shadow: 0px 50px 120px rgba(0, 0, 0, 0.4);

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 26px;
      margin-bottom: 40px;

      .title {
        flex-grow: 1;
        font-weight: 500;
        font-size: 20px;
        line-height: 26px;
        color: var(--theme-caption-color);
      }
      .tool {
        width: 16px;
        height: 16px;
        margin-left: 12px;
        opacity: .4;
        cursor: pointer;
        &:hover {
          opacity: 1;
        }
      }
    }

    .footer {
      display: flex;
      flex-direction: row-reverse;
      margin-top: 56px;
    }
  }
</style>