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
  import type { Ref } from '@anticrm/core'
  import { getClient } from '@anticrm/workbench'
  import recruiting from '@anticrm/recruiting'
  import action from '@anticrm/action-plugin'
  import type { Action } from '@anticrm/action-plugin'
  import type { QueryUpdater } from '@anticrm/presentation'
  import type { Applicant, Candidate } from '@anticrm/recruiting'

  import ActionPresenter from './ActionPresenter.svelte'

  export let doc: Applicant

  const client = getClient()

  let candidate: Candidate | undefined
  let candidateQ: QueryUpdater<Candidate> | undefined
  $: candidateQ = client.query(
    candidateQ,
    recruiting.class.Candidate,
    { _id: doc.item as Ref<Candidate> },
    ([first]) => {
      candidate = first
    }
  )

  let actions: Action[] = []
  let actionsQ: QueryUpdater<Action> | undefined
  $: actionsQ = client.query(actionsQ, action.class.Action, {}, (res) => {
    actions = res
  })
</script>

{#if candidate}
  <div class="root">
    <div class="header">
      {`${candidate.firstName} ${candidate.lastName}`}
    </div>
    {#each actions as action (action._id)}
      <ActionPresenter {action} target={candidate._id} />
    {/each}
  </div>
{/if}

<style lang="scss">
  .root {
    display: flex;
    flex-direction: column;

    gap: 10px;
    min-height: 50px;

    background-color: var(--theme-button-bg-hovered);
    border: 1px solid var(--theme-bg-accent-color);
    border-radius: 12px;
  }
  .header {
    display: flex;
    justify-content: center;
    align-items: center;

    font-weight: 500;
  }
</style>
