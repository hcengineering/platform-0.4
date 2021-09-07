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
  import ui, { ScrollBox, IconGroup, IconList, IconCard, IconKanban } from '@anticrm/ui'
  import type { Task } from '@anticrm/task'
  import type { IntlString, UIComponent } from '@anticrm/status'

  import KanbanView from './KanbanView.svelte'
  import TableView from './TableView.svelte'
  import CardView from './CardView.svelte'

  type IDs = 'list' | 'card' | 'kanban'

  const items: {
    icon: UIComponent
    tooltip: IntlString
    id: IDs
  }[] = [
    { icon: IconList, tooltip: ui.string.List, id: 'list' },
    { icon: IconCard, tooltip: ui.string.Cards, id: 'card' },
    { icon: IconKanban, tooltip: ui.string.Kanban, id: 'kanban' }
  ]
  let selected: IDs = 'list'

  export let query: DocumentQuery<Task>
</script>

<div class="toolbar">
  <IconGroup {items} bind:selected />
</div>
{#if selected === 'kanban'}
  <KanbanView {query} />
{:else if selected === 'card'}
  <div class="content">
    <ScrollBox vertical>
      <CardView {query} />
    </ScrollBox>
  </div>
{:else if selected === 'list'}
  <TableView {query} />
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
