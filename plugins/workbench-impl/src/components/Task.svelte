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
  import ViewSelection from './ViewSelection.svelte'
  import KanbanView from './KanbanView.svelte'
  import TableView from './TableView.svelte'
  import { Tabs, ScrollBox } from '@anticrm/ui'

  export let view: string = 'kanban'
</script>

<div class="container">
  <Tabs/>
  <div class="tab">
    <div class="toolbar">
      <div style="flex-grow: 1"></div>
      <ViewSelection bind:selected={view}/>
    </div>
    {#if view === 'kanban'}
      <ScrollBox>
        <KanbanView/>
      </ScrollBox>
    {:else if view === 'list'}
      <ScrollBox vertical>
        <TableView/>
      </ScrollBox>
    {/if}
  </div>
</div>

<style lang="scss">
  .container {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;

    .tab {
      display: flex;
      flex-direction: column;
      height: 100%;
      margin: 40px;
      .toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        min-height: 80px;
        height: 80px;
      }
    }
  }
</style>
