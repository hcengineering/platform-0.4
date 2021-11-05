<!--
// Copyright © 2021 Anticrm Platform Contributors.
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
  import { IntlString } from '@anticrm/status'
  import Add from './icons/Add.svelte'
  import Label from './Label.svelte'

  export let label: IntlString | string
  export let addHandler: () => void | undefined
</script>

<div class="header flex-row-center">
  <Label {label} />
  {#if addHandler}
    <div class="icon" on:click={addHandler}>
      <div><Add size={10} /></div>
    </div>
  {/if}
</div>

<style lang="scss">
  .header {
    color: var(--theme-caption-color);
    font-weight: 500;
    font-size: 20px;
    margin-top: 48px;
    margin-bottom: 28px;

    .icon {
      display: flex;
      margin-left: 12px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background-color: var(--theme-button-bg-enabled);
      border-color: var(--theme-button-border-enabled);
      border-style: solid;
      border-width: 1px;

      div {
        margin: auto;
      }
    }
  }
</style>
