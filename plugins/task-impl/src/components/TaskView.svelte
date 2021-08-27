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
  import type { Ref, Class, Doc, Space } from '@anticrm/core'
  import ViewSelection from './ViewSelection.svelte'
  import KanbanView from './KanbanView.svelte'
  import TableView from './TableView.svelte'
  import CardView from './CardView.svelte'
  import ui, { ScrollBox } from '@anticrm/ui'
  import task from '@anticrm/task'
  import type { IntlString } from '@anticrm/status'

  export let view: IntlString = ui.string.List
  export let currentSpace: Ref<Space>
  const _class: Ref<Class<Doc>> = task.class.Task
</script>

<div class="toolbar">
  <ViewSelection bind:selected={view} />
</div>
{#if view === ui.string.Kanban}
  <KanbanView {currentSpace} />
{:else if view === ui.string.Cards}
  <div class="content">
    <ScrollBox vertical>
      <CardView {_class} {currentSpace} />
    </ScrollBox>
  </div>
{:else if view === ui.string.List}
  <TableView {currentSpace} />
{/if}

<style lang="scss">
  .toolbar {
    display: flex;
    flex-direction: row-reverse;
    justify-content: space-between;
    align-items: center;
    margin: 20px 40px;
    min-height: 40px;
    height: 40px;
  }
  .content {
    height: 100%;
    margin: 0 40px 40px;
  }
</style>
