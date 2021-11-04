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
  import { TaskStatuses } from '@anticrm/task'
  import { PopupItem } from '@anticrm/ui'
  import { createEventDispatcher } from 'svelte'
  import TaskStatus from './TaskStatus.svelte'

  export let selected: IntlString
  export let maxHeight: number = 0
  const dispatch = createEventDispatcher()

  const items = Object.entries(TaskStatuses).map(([k, v]) => v)
</script>

<div class="status-popup" style="max-height: {maxHeight ? maxHeight + 'px' : 'max-content'}">
  {#each items as item}
    <PopupItem
      component={TaskStatus}
      props={{ value: item }}
      selectable
      action={() => {
        selected = item

        dispatch('close', selected)
      }}
    />
  {/each}
</div>

<style lang="scss">
  .status-popup {
    display: flex;
    flex-direction: column;
    margin-right: 7px;
    padding: 8px 1px 12px 8px;
    height: min-content;
    background-color: var(--theme-popup-bg);
    border: var(--theme-popup-border);
    border-radius: 20px;
    box-shadow: var(--theme-popup-shadow);
    -webkit-backdrop-filter: blur(30px);
    backdrop-filter: blur(30px);
  }
</style>
