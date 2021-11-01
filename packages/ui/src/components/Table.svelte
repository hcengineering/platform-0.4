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
  import type { IntlString, UIComponent } from '@anticrm/status'

  import Label from './Label.svelte'
  import VirtualList, { sty } from './VirtualList.svelte'

  interface Cell {
    component: UIComponent
    width?: number
    props?: Object
  }

  interface Column {
    properties: ColumnProp[]
    label: IntlString
    component: UIComponent
    width?: number
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
  let list: any

  export let showHeader: boolean = false
  export let columns: Column[]
  export let data: Data[]

  const docToRow = (doc: Data): Cell[] =>
    columns.map(({ component, width, properties }) => ({
      component,
      width,
      props: properties.reduce(
        (r, prop) => ({
          ...r,
          [prop.property]: prop.key ? doc[prop.key] : prop.value
        }),
        {}
      )
    }))

  const widthSty = (f: { width?: number }) =>
    f.width !== undefined ? `min-width: ${f.width}px; width: ${f.width}px` : ''

  $: if (data || !data) {
    list?.reset()
  }
</script>

<div class="table">
  {#if showHeader}
    <div class="header">
      {#each columns as field}
        <div class="cell" style={widthSty(field)}><Label label={field.label} /></div>
      {/each}
    </div>
  {/if}
  <div class="rows-container">
    <div class="rows">
      <VirtualList bind:this={list} itemCount={data.length} let:items getItemSize={() => 60}>
        {#each items as item (data[item.index]._id)}
          <div class="row" style={sty(item.style)} on:click={() => dispatch('rowClick', data[item.index])}>
            {#each docToRow(data[item.index]) as cell}
              <div class="cell" style={widthSty(cell)}>
                <svelte:component this={cell.component} {...cell.props} />
              </div>
            {/each}
          </div>
        {/each}
      </VirtualList>
    </div>
  </div>
</div>

<style lang="scss">
  .table {
    height: 100%;
    padding-bottom: 40px;
  }

  .rows-container {
    position: relative;
    width: 100%;
    height: 100%;

    border-radius: 0 0 20px 20px;
    background-color: var(--theme-table-bg-color);
  }

  .rows {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;

    padding-bottom: 20px;
  }

  .cell {
    width: 100%;
    padding: 0 24px;

    flex-grow: 0;

    overflow: hidden;
    &:first-child {
      padding-left: 40px;
    }
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    height: 40px;
    font-weight: 500;
    font-size: 12px;
    color: var(--theme-content-dark-color);
    background-color: var(--theme-bg-color);
    box-shadow: inset 0 -1px 0 0 var(--theme-bg-focused-color);
    z-index: 1;
  }

  .row {
    display: flex;
    align-items: center;
    justify-content: space-evenly;

    color: var(--theme-caption-color);
    border-bottom: 1px solid var(--theme-button-border-hovered);

    &:last-child {
      border-bottom: unset;
    }

    &:hover {
      background-color: var(--theme-table-bg-hover);
    }
  }
</style>
