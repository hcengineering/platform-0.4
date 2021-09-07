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
  import type { VacancySpace } from '@anticrm/recruiting'

  import List from '../icons/List.svelte'
  import Kanban from '../icons/Kanban.svelte'

  import ApplicantTable from './ApplicantTable.svelte'
  import VacancyKanban from './VacancyKanban.svelte'

  export let space: VacancySpace

  const options = [
    { icon: List, view: ApplicantTable },
    { icon: Kanban, view: VacancyKanban }
  ]
  let selected: typeof options[number] = options[0]
</script>

<div class="root">
  <div class="selector">
    {#each options as opt}
      <div
        class="opt"
        class:selected={opt === selected}
        on:click={() => {
          selected = opt
        }}
      >
        <svelte:component this={opt.icon} />
      </div>
    {/each}
  </div>
  <svelte:component this={selected.view} {space} />
</div>

<style lang="scss">
  .root {
    display: flex;
    flex-direction: column;
    align-items: stretch;

    flex-grow: 1;

    width: 100%;
    height: 100%;
  }

  .selector {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 5px;
    padding: 20px 40px;

    width: 100%;
  }

  .opt {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background-color: transparent;
    cursor: pointer;

    &.selected {
      background-color: var(--theme-button-bg-enabled);
      cursor: default;
    }
  }
</style>
