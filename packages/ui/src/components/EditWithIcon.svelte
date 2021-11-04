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
  import type { Asset, UIComponent } from '@anticrm/status'
  import Icon from './Icon.svelte'

  export let icon: Asset | UIComponent
  export let width: string | undefined = undefined
  export let value: string | undefined = undefined
  export let id: string | undefined = undefined
  export let placeholder: string = 'placeholder'
</script>

<div class="editbox" style={width ? 'width: ' + width : ''}>
  <input type="text" {id} bind:value {placeholder} on:change on:keyup on:blur on:focus />
  <div class="icon">
    <Icon {icon} size={16} />
  </div>
</div>

<style lang="scss">
  .editbox {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0;
    min-width: 268px;
    height: 40px;
    background-color: var(--theme-bg-focused-color);
    border: 1px solid var(--theme-bg-accent-color);
    border-radius: 8px;

    &:focus-within {
      border-color: var(--theme-bg-focused-border);
    }
    input {
      width: 100%;
      height: 40px;
      margin: 0;
      padding: 10px 12px;
      font-family: inherit;
      color: var(--theme-caption-color);
      background-color: transparent;
      outline: none;
      border: none;
      border-radius: 8px;

      &::placeholder {
        color: var(--theme-content-trans-color);
      }
    }

    .icon {
      margin: 12px;
      width: 16px;
      height: 16px;
      opacity: 0.3;
    }
  }
</style>
