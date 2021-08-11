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
  import type { IntlString } from '@anticrm/platform'
  import Label from './Label.svelte'

  export let label: IntlString | undefined = undefined
  export let width: string | undefined = undefined
  export let height: string | undefined = undefined
  export let value: string | undefined = undefined
  export let id: string | undefined = undefined
  export let lines: number = 5
  export let placeholder: string | undefined = 'Start typing...'
</script>

<div class="textarea" style="{width ? `width: ${width}px;` : ''} {height ? `height: ${height}px;` : ''}">
  {#if label}<div class="label"><Label {label} /></div>{/if}
  <textarea {id} rows={lines} bind:value on:keyup {placeholder} />
</div>

<style lang="scss">
  .textarea {
    display: flex;
    flex-direction: column;
    min-width: 50px;
    min-height: 36px;

    .label {
      margin-bottom: 4px;
      font-size: 12px;
      font-weight: 500;
      color: var(--theme-content-accent-color);
      opacity: 0.8;
      pointer-events: none;
      user-select: none;
    }

    textarea {
      width: auto;
      min-height: 70px;
      margin: -4px;
      padding: 2px;
      font-family: inherit;
      font-size: 14px;
      line-height: 150%;
      color: var(--theme-caption-color);
      background-color: transparent;
      border: 2px solid transparent;
      border-radius: 2px;
      outline: none;
      overflow-y: scroll;
      resize: none;

      &:focus {
        border-color: var(--primary-button-enabled);
      }
      &::placeholder {
        color: var(--theme-content-dark-color);
      }
    }
  }
</style>
