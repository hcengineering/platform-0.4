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
  import type { Doc, Ref } from '@anticrm/core'
  import { getPlugin } from '@anticrm/platform'
  import { getClient } from '@anticrm/workbench'
  import type { QueryUpdater } from '@anticrm/presentation'
  import actionPlugin from '@anticrm/action-plugin'
  import type { Action, ActionInstance, ExecutionContext } from '@anticrm/action-plugin'
  import { Button } from '@anticrm/ui'
  import type { Applicant } from '@anticrm/recruiting';

  export let action: Action
  export let target: Applicant
  export let instance: ActionInstance

  const client = getClient()

  let stack: any[] = []
  let stackQ: QueryUpdater<ExecutionContext> | undefined
  $: if (instance) {
    stackQ = client.query(
      stackQ,
      actionPlugin.class.ExecutionContext,
      {
        _id: instance.context
      },
      (res) => {
        stack = res[0]?.stack ?? []
      }
    )
  }

  async function run () {
    if (instance !== undefined) {
      return
    }

    const actionP = await getPlugin(actionPlugin.id)

    await actionP.runAction(action, `${target._id}_${target.state}`)
  }
</script>

<div class="root">
  <div class="header">
    <div class="label">
      {action.name}
    </div>
    {#if instance === undefined}
      <Button label="Run" on:click={run} />
    {/if}
  </div>
  {#if instance !== undefined}
    <div class="details">
      Stack: [{stack.join(' ')}]
    </div>
  {/if}
</div>

<style lang="scss">
  .root {
    display: flex;
    flex-direction: column;

    gap: 10px;
  }

  .header {
    display: flex;
    align-items: center;
  }

  .label {
    flex-grow: 1;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-weight: 500;
  }
</style>
