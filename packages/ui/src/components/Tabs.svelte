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
  import type { IntlString } from '@anticrm/status'
  import Label from './Label.svelte'

  export let tabs: Array<IntlString> = [
    'Applications' as IntlString,
    'Interviews' as IntlString,
    'Activity' as IntlString,
    'Documents' as IntlString,
    'Details' as IntlString
  ]

  export let selected: IntlString = 'Details' as IntlString
</script>

<div class="tabs-container">
  {#each tabs as tab}
    <div
      class="tab"
      class:selected={tab === selected}
      on:click={() => {
        selected = tab
      }}
    >
      <Label label={tab} />
    </div>
  {/each}
  <div class="grow" />
</div>

<style lang="scss">
  .tabs-container {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    flex-wrap: nowrap;
    width: 100%;
    height: 74px;
    min-height: 74px;
    border-bottom: 1px solid var(--theme-dialog-divider);
    margin-bottom: 40px;

    .tab {
      display: flex;
      align-items: center;
      margin-top: 28px;
      padding-bottom: 28px;
      color: var(--theme-content-trans-color);
      cursor: pointer;
      user-select: none;

      &.selected {
        border-top: 2px solid transparent;
        border-bottom: 2px solid var(--theme-caption-color);
        color: var(--theme-caption-color);
        cursor: default;
      }
    }
    .tab + .tab {
      margin-left: 40px;
    }
    .grow {
      min-width: 40px;
      flex-grow: 1;
    }
  }
</style>
