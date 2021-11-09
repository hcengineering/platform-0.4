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
  import core, { Class, Ref, ShortRef } from '@anticrm/core'
  import { getClient } from '@anticrm/workbench'

  import type { Task } from '@anticrm/task'
  import { showPopup } from '@anticrm/ui'

  import task from '../../plugin'

  const client = getClient()

  export let objectId: Ref<Task>
  export let objectClass: Ref<Class<Task>>

  let shortRef: ShortRef | undefined

  $: if (objectClass !== undefined) {
    client.findAll(core.class.ShortRef, { objectId: objectId, objectClass: objectClass }).then((result) => {
      shortRef = result.shift()
    })
  }
</script>

{#if shortRef}
  <div class="container">
    <div class="line" />
    <div
      class="content link-text"
      on:click={() => {
        showPopup(task.component.EditTask, { id: objectId }, 'right')
      }}
    >
      <span>Task {shortRef._id}</span>
    </div>
  </div>
{/if}

<style lang="scss">
  .container {
    flex-shrink: 0;
    display: flex;
    align-items: stretch;
    min-width: 466px;

    .line {
      margin-right: 14px;
      width: 5px;
      background-color: #22cc62;
      border-radius: 3px;
    }
    .content {
      display: flex;
      width: 444px;
      flex-direction: column;
      background-color: var(--theme-button-bg-enabled);
      border: 1px solid var(--theme-bg-accent-color);
      border-radius: 12px;
    }
  }
</style>
