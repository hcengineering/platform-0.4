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
  import { getClient } from '@anticrm/workbench'
  import type { QueryUpdater } from '@anticrm/presentation'
  import actionPlugin from '@anticrm/action-plugin'
  import type { Action, ActionInstance } from '@anticrm/action-plugin'
  import type { UIComponent } from '@anticrm/status'
  import type { Applicant } from '@anticrm/recruiting'
  import recruiting from '@anticrm/recruiting'

  import InterviewAction from '../actions/InterviewAction.svelte'

  export let action: Action
  export let target: Applicant

  const client = getClient()

  let instance: ActionInstance | undefined
  let instanceQ: QueryUpdater<ActionInstance> | undefined
  $: instanceQ = client.query(
    instanceQ,
    actionPlugin.class.ActionInstance,
    {
      target: `${target._id}_${target.state}`,
      action: action._id
    },
    (res) => {
      instance = res[0]
    }
  )

  const componentMap = new Map([[recruiting.action.Interview, InterviewAction as UIComponent]])

  let component: UIComponent | undefined
  $: component = componentMap.get(action.resId)
</script>

{#if component !== undefined}
  <svelte:component this={component} {action} {instance} {target} />
{/if}
