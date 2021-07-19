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
  import type { IntlString } from '@anticrm/status'

  import { AnySvelteComponent } from '../types'
  import Label from './Label.svelte'

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

  export let showHeader: boolean = false
  export let columns: Column[]
  export let data: any[]

  const docToRow = (doc: any): Cell[] =>
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

<table class="table-body">
  {#if showHeader}
    <tr class="tr-head">
      {#each columns as field}
        <th><Label label={field.label} /></th>
      {/each}
    </tr>
  {/if}
  {#each data as doc (doc._id)}
    <tr class="tr-body">
      {#each docToRow(doc) as cell}
        <td><svelte:component this={cell.component} {...cell.props} /></td>
      {/each}
    </tr>
  {/each}
</table>

<style lang="scss">
  .table-body {
    display: table;
    border-collapse: collapse;

    td {
      align-items: center;
      height: 64px;
      padding: 6px 20px;
      color: var(--theme-content-accent-color);
    }
    th {
      align-items: center;
      height: 50px;
      padding: 0 20px;
      font-weight: 500;
      text-align: left;
      color: var(--theme-content-trans-color);
    }
    .tr-head {
      position: sticky;
      top: 0;
      background-color: var(--theme-bg-color);
      border-bottom: 1px solid var(--theme-bg-focused-color);
      box-shadow: 0 1px 0 var(--theme-bg-focused-color);
      z-index: 5;
    }
    .tr-body {
      position: relative;
      border-top: 1px solid var(--theme-bg-accent-hover);
      &:nth-child(2) {
        border-top: 1px solid transparent;
      }
      &:last-child {
        border-bottom: 1px solid transparent;
      }
    }
    .tr-body:hover {
      & > td {
        border-top: 1px solid transparent;
        border-bottom: 1px solid transparent;
        background-color: var(--theme-button-bg-enabled);
        &:first-child {
          border-radius: 12px 0 0 12px;
        }
        &:last-child {
          border-radius: 0 12px 12px 0;
        }
      }
    }
  }
</style>
