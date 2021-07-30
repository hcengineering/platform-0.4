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
  import { ActionIcon, CheckBox, EditBox, Label, IconAdd } from '@anticrm/ui'
  import type { CheckListItem } from '@anticrm/task'
  import task from '../plugin'

  export let items: Array<CheckListItem>
  let newItem: CheckListItem | undefined

  async function add () {
    if (newItem !== undefined) {
      items.push(newItem)
      items = items
      newItem = undefined
    }
  }

  async function change () {
    items = items.filter((item) => item.description)
  }
</script>

<div class="content" on:change>
  {#each items as item}
    <div class="row">
      <div><CheckBox bind:checked={item.done} /></div>
      <div><EditBox width={'100%'} bind:value={item.description} on:change={change} /></div>
    </div>
  {/each}
  {#if newItem}
    <div class="row">
      <div><CheckBox bind:checked={newItem.done} /></div>
      <div><EditBox width={'100%'} bind:value={newItem.description} on:change={add} /></div>
    </div>
  {/if}
  <div class="row">
    <div>
      <ActionIcon
        size={20}
        icon={IconAdd}
        label={task.string.AddCheckItem}
        action={() => {
          newItem = { description: '', done: false }
        }}
      />
    </div>
    <div><Label label={task.string.AddCheckItem} /></div>
  </div>
</div>

<style lang="scss">
  .title {
    color: var(--theme-caption-color);
    display: flex;
    align-items: center;
    white-space: nowrap;
    user-select: none;
    font-size: 16px;
    font-weight: 500;
    margin: 10px;
  }

  .content {
    background-color: var(--theme-bg-accent-color);
    margin-top: 10px;
    border: 1px solid var(--theme-bg-accent-hover);
    border-radius: 12px;

    .row {
      padding: 5px;
      margin: 5px;
      display: flex;
      align-items: center;

      div + div {
        margin-left: 16px;
        flex-grow: 1;
      }

      .checkBox {
        margin-right: 5px;
      }
    }
  }
</style>
