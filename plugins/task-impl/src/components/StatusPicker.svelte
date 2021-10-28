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
  import { PopupMenu, PopupItem, Label } from '@anticrm/ui'
  import Status from './Status.svelte'
  import task, { TaskStatuses } from '@anticrm/task'
  import type { IntlString } from '@anticrm/status'
  import { createEventDispatcher } from 'svelte'

  export let selected: IntlString
  export let margin: number = 5
  let title: IntlString = task.string.Status
  const dispatch = createEventDispatcher()

  const items = Object.entries(TaskStatuses).map(([k, v]) => v)
  let pressed: boolean = false
</script>

<div class="statusPicker">
  <PopupMenu {margin} bind:show={pressed} bind:title>
    <PopupItem
      component={Status}
      props={{ value: selected }}
      selectable
      selected
      action={() => {
        pressed = !pressed
      }}
    />
    {#each items.filter((u) => u !== selected) as item}
      <PopupItem
        component={Status}
        props={{ value: item }}
        selectable
        action={() => {
          selected = item
          pressed = !pressed
          dispatch('change', selected)
        }}
      />
    {/each}
  </PopupMenu>
  <div
    class="selected"
    on:click|preventDefault={(event) => {
      pressed = !pressed
      event.stopPropagation()
    }}
  >
    <div class="title"><Label label={title} /></div>
    <Status value={selected} />
  </div>
</div>

<style lang="scss">
  .statusPicker {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    width: auto;

    .selected {
      font-size: 14px;
      .title {
        color: var(--theme-content-color);
      }
    }
  }
</style>
