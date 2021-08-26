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
  import type { DocumentQuery } from '@anticrm/core'
  import ViewSelection from './ViewSelection.svelte'
  import KanbanView from './KanbanView.svelte'
  import TableView from './TableView.svelte'
  import CardView from './CardView.svelte'
  import ui, { ScrollBox } from '@anticrm/ui'
  import type { Task } from '@anticrm/task'
  import type { IntlString } from '@anticrm/status'

  export let view: IntlString = ui.string.List
  export let query: DocumentQuery<Task>
</script>

<div class="container">
  <div class="tab">
    <div class="toolbar">
      <div style="flex-grow: 1" />
      <ViewSelection bind:selected={view} />
    </div>
    {#if view === ui.string.Kanban}
      <ScrollBox>
        <KanbanView {query} />
      </ScrollBox>
    {:else if view === ui.string.Cards}
      <ScrollBox vertical>
        <CardView {query} />
      </ScrollBox>
    {:else if view === ui.string.List}
      <ScrollBox vertical>
        <TableView {query} />
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
