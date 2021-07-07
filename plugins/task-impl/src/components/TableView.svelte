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
  import type { AnySvelteComponent } from '@anticrm/ui'
  import { Ref, Class, Doc, Space} from '@anticrm/core'
  import type { IntlString } from '@anticrm/status'
  import { getClient } from '@anticrm/workbench'
  import Label from '@anticrm/ui/src/components/Label.svelte'

  interface Cell {
    component: AnySvelteComponent
    props?: Object
  }

  interface Field {
    properties: FieldProp[],
    label: IntlString,
    component: AnySvelteComponent
  }

  interface FieldProp {
    property: string,
    key?: string,
    value?: any
  }

  export let _class: Ref<Class<Doc>>
  export let currentSpace: Ref<Space> | undefined
  export let fields: Field[]
  const client = getClient()
  $: if (currentSpace != undefined) client.query(_class, { space: currentSpace }, (result) => data = result)

  let data: Doc[] = []
  function getCells (doc: Doc): Cell[] {
    const result: Cell[] = []
    for (const field of fields) {
      const props = new Object()
      for (const prop of field.properties) {
        (props as any)[prop.property] = prop.key === undefined ? prop.value : (doc as any)[prop.key]
      }
      result.push({component: field.component, props: props})
    }
    return result
  }

</script>

  <table class="table-body">
    <tr class="tr-head">
      {#each fields as field}
        <th><Label label = {field.label}/></th>
      {/each}
    </tr>
    {#each data as object (object._id)}
      <tr class="tr-body">
      {#each getCells(object) as cell}
        <td><svelte:component this={cell.component} {...cell.props}/></td>
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
        box-shadow: 0 1px 0 var(--theme-bg-focused-color);
        z-index: 10;
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
  