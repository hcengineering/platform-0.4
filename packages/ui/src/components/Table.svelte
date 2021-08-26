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
  import { createEventDispatcher } from 'svelte'
  import type { IntlString } from '@anticrm/status'

  import type { AnySvelteComponent } from '../types'
  import Label from './Label.svelte'
  import ScrollBox from './ScrollBox.svelte'

  interface Cell {
    component: AnySvelteComponent
    props?: Object
  }

  interface Column {
    properties: ColumnProp[]
    label: IntlString
    component: AnySvelteComponent
  }

  interface ColumnProp {
    property: string
    key?: string
    value?: any
  }

  type Data = any & {
    _id: string
  }

  const dispatch = createEventDispatcher()

  export let showHeader: boolean = false
  export let columns: Column[]
  export let data: Data[]

  const docToRow = (doc: Data): Cell[] =>
    columns.map(({ component, properties }) => ({
      component,
      props: properties.reduce(
        (r, prop) => ({
          ...r,
          [prop.property]: prop.key ? doc[prop.key] : prop.value
        }),
        {}
      )
    }))
</script>

<div class="container">
  <ScrollBox vertical stretch noShift>
    <table class="table-body">
      {#if showHeader}
        <thead>
          <tr class="tr-head">
            {#each columns as field}
              <th><Label label={field.label} /></th>
            {/each}
          </tr>
        </thead>
      {/if}
      <tbody>
        {#each data as doc (doc._id)}
          <tr class="tr-body" on:click={() => dispatch('rowClick', { id: doc._id })}>
            {#each docToRow(doc) as cell}
              <td><svelte:component this={cell.component} {...cell.props} /></td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </ScrollBox>
</div>

<style lang="scss">
  .container {
    flex-grow: 1;
    position: relative;
    padding-bottom: 40px;
    height: max-content;

    &::before {
      position: absolute;
      content: '';
      top: 40px;
      bottom: 0;
      width: 100%;
      background-color: var(--theme-table-bg-color);
      border-radius: 0 0 20px 2px;
    }
  }

  .table-body { width: 100%; }

  th, td {
    padding: 8px 24px;
    text-align: left;
    &:first-child { padding-left: 40px; }
  }

  th {
    position: sticky;
    top: 0;
    height: 40px;
    font-weight: 500;
    font-size: 12px;
    color: var(--theme-content-dark-color);
    background-color: var(--theme-bg-color);
    box-shadow: inset 0 -1px 0 0 var(--theme-bg-focused-color);
    z-index: 1;
  }

  .tr-body {
    height: 60px;
    color: var(--theme-caption-color);
    border-bottom: 1px solid var(--theme-button-border-hovered);
    &:last-child { border-bottom: none; }
    &:hover { background-color: var(--theme-table-bg-hover); }
  }
</style>
