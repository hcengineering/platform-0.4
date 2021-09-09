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
  import type { IntlString, UIComponent } from '@anticrm/status'
  import type { CandidatePoolSpace } from '@anticrm/recruiting'
  import ui, { IconGroup, IconList } from '@anticrm/ui'

  import CandidateTable from './CandidateTable.svelte'

  export let space: CandidatePoolSpace
  type IDs = 'list'

  const items: {
    icon: UIComponent
    tooltip: IntlString
    id: IDs
  }[] = [{ icon: IconList, tooltip: ui.string.List, id: 'list' }]
  let selected: IDs = 'list'

  const views = new Map([['list', CandidateTable]])
  let view: UIComponent | undefined = CandidateTable
  $: view = views.get(selected)
</script>

<div class="root">
  <div class="selector">
    <IconGroup {items} bind:selected />
  </div>
  {#if view !== undefined}
    <svelte:component this={view} currentSpace={space._id} />
  {/if}
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
</style>
