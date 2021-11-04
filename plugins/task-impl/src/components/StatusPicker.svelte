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
  import { showPopup } from '@anticrm/ui'
  import { createEventDispatcher } from 'svelte'
  import StatusPickerPopup from './StatusPickerPopup.svelte'
  import TaskStatus from './TaskStatus.svelte'

  export let selected: IntlString
  const dispatch = createEventDispatcher()
  let btn: HTMLElement | undefined
</script>

<div class="statusPicker">
  <div
    bind:this={btn}
    class="selected"
    on:click|preventDefault={(event) => {
      showPopup(StatusPickerPopup, { selected }, btn, (result) => {
        // undefined passed when closed without changes, null passed when unselect
        if (result !== undefined && result !== selected) {
          selected = result
          dispatch('change', selected)
        }
      })
      event.stopPropagation()
    }}
  >
    <TaskStatus value={selected} />
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
    }
  }
</style>
