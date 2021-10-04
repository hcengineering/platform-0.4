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
  import type { State } from '@anticrm/fsm'
  import fsm from '@anticrm/fsm'
  import type { QueryUpdater } from '@anticrm/presentation'
  import { Label, ActionIcon, Spinner } from '@anticrm/ui'
  import type { Applicant, Candidate } from '@anticrm/recruiting'

  import ActionPresenter from './ActionPresenter.svelte'

  import Dots from '../icons/Dots.svelte'

  export let doc: Applicant

  const client = getClient()

  let candidate: Candidate | undefined
  let candidateQ: QueryUpdater<Candidate> | undefined
  let isLoading = true
  $: candidateQ = client.query(
    candidateQ,
    recruiting.class.Candidate,
    { _id: doc.item as Ref<Candidate> },
    ([first]) => {
      isLoading = false
      candidate = first
    }
  )

  let state: State | undefined
  let stateQ: QueryUpdater<State> | undefined
  $: stateQ = client.query(stateQ, fsm.class.State, { _id: doc.state }, (res) => {
    state = res[0]
  })

  let actions: Action[] = []
  let actionsQ: QueryUpdater<Action> | undefined
  $: if (state) {
    actionsQ = client.query(
      actionsQ,
      action.class.Action,
      { _id: { $in: state.optionalActions.concat(state.requiredActions) } },
      (res) => {
        actions = res
      }
    )
  }
</script>

<div class="root">
  {#if candidate}
    <div class="header" class:noContent={actions.length === 0}>
      <div class="candidate">
        <div class="candidate-avatar">
          <img width="100%" height="100%" src={candidate.avatar} alt="avatar" />
        </div>
        <div class="candidate-info">
          <div class="candidate-title">
            <Label label={recruiting.string.Candidate} />
          </div>
          <div class="candidate-name">
            {`${candidate.firstName} ${candidate.lastName}`}
          </div>
        </div>
      </div>
      <ActionIcon icon={Dots} size={24} />
    </div>
    {#if actions.length > 0}
      <div class="content">
        {#each actions as action (action._id)}
          <ActionPresenter {action} target={doc} />
        {/each}
      </div>
    {/if}
  {:else if isLoading}
    <div class="spinner">
      <Spinner />
    </div>
  {/if}
</div>

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

  .spinner {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-grow: 1;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-radius: 12px 12px 0 0;

    font-weight: 500;

    height: 70px;
    padding: 0 15px;
    background-color: var(--theme-button-bg-focused);

    &.noContent {
      border-radius: 12px;
    }
  }

  .candidate {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
  }

  .candidate-avatar {
    width: 32px;
    height: 32px;

    border-radius: 50%;
    overflow: hidden;

    pointer-events: none;
  }

  .candidate-info {
    display: flex;
    flex-direction: column;
  }

  .candidate-title {
    font-weight: 400;
    opacity: 0.4;
    text-shadow: 0px 0px 8px rgba(255, 255, 255, 0.25);
  }

  .candidate-name {
    font-weight: 500;
  }

  .content {
    display: flex;
    flex-direction: column;

    gap: 15px;

    padding: 15px;
  }
</style>
