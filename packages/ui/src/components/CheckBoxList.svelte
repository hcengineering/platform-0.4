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
  import { generateId } from '@anticrm/core'

  import type { IntlString } from '@anticrm/platform'
  import { createEventDispatcher } from 'svelte'
  import type { CheckListItem } from '..'
  import CheckBoxWithLabel from './CheckBoxWithLabel.svelte'
  import Header from './Header.svelte'

  export let label: IntlString
  export let items: Array<CheckListItem>
  export let editable: boolean = false

  const dispatch = createEventDispatcher()

  function addHandler (): void {
    items.push({ id: generateId(), description: '', done: false })
    items = items
  }
</script>

<div class="checkbox-list">
  <Header {label} addHandler={editable ? addHandler : undefined} />
  {#each items as item}
    <div class="list-item">
      <CheckBoxWithLabel
        bind:value={item.description}
        bind:checked={item.done}
        {editable}
        on:change={(ev) => {
          items = items.filter((i) => i.description !== '')
          console.log('items', items, ev, item)
          dispatch('change', item)
        }}
      />
    </div>
  {/each}
</div>

<style lang="scss">
  .checkbox-list {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    max-width: 100%;
    font-size: 14px;
    line-height: 21px;
    .list-item + .list-item {
      margin-top: 20px;
    }
  }
</style>
