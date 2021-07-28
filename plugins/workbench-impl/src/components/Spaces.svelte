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
  import core, { Ref, Class, Space } from '@anticrm/core'
  import type { QueryUpdater } from '@anticrm/presentation'
  import type { IntlString } from '@anticrm/status'
  import ui, { Dialog, EditBox } from '@anticrm/ui'
  import { Button } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'

  export let _class: Ref<Class<Space>>
  export let label: IntlString

  let spaces: Space[] = []
  let search: string = ''

  const client = getClient()
  const accountId = client.accountId()
  let query: QueryUpdater<Space> | undefined

  $: {
    query = client.query(query, _class, { name: { $like: '%' + search + '%' } }, (result) => {
      spaces = result
    })
  }

  function join (id: Ref<Space>) {
    client.updateDoc(_class, core.space.Model, id, {
      $push: { members: accountId }
    })
  }

  function leave (id: Ref<Space>) {
    client.updateDoc(_class, core.space.Model, id, {
      $pull: { members: accountId }
    })
  }
</script>

<Dialog {label} okLabel={ui.string.Close} okAction={() => {}} withCancel={false} on:close>
  <EditBox label={ui.string.Search} bind:value={search} />
  <table class="table-body">
    {#each spaces as space (space._id)}
      <tr class="tr-body">
        <td>{space.name}</td>
        <td>{space.description}</td>
        <td>{space.members.length}</td>
        {#if space.members.includes(accountId)}
          <td
            ><Button
              label={ui.string.Leave}
              on:click={() => {
                leave(space._id)
              }}
            /></td
          >
        {:else}
          <td
            ><Button
              label={ui.string.Join}
              primary
              on:click={() => {
                join(space._id)
              }}
            /></td
          >
        {/if}
      </tr>
    {/each}
  </table>
</Dialog>

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
