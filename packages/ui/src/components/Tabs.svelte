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

  interface Tab {
    title: IntlString
  }

  export let tabs: Array<Tab> = [
    { title: 'Applications' },
    { title: 'Interviews' },
    { title: 'Activity' },
    { title: 'Documents' },
    { title: 'Details' }
  ]
  export let selected: IntlString = 'Details'
</script>

<div class="tabs-container">
  {#each tabs as tab}
    <div
      class="tab"
      class:selected={tab.title === selected}
      on:click={() => {
        selected = tab.title
      }}
    >
      <Label label={tab.title} />
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
    height: 54px;
    min-height: 54px;
    border-bottom: 1px solid var(--theme-menu-divider);

    .tab {
      display: flex;
      align-items: center;
      margin-left: 40px;
      height: 54px;
      color: var(--theme-content-trans-color);
      cursor: pointer;
      user-select: none;

      &.selected {
        border-top: 2px solid transparent;
        border-bottom: 2px solid var(--primary-button-enabled);
        color: var(--theme-caption-color);
        cursor: default;
      }
    }
    .tab + .tab {
      margin-left: 64px;
    }
    .grow {
      min-width: 40px;
      flex-grow: 1;
    }
  }
</style>
