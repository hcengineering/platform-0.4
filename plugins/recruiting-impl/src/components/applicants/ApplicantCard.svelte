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
  import { selectDocument } from '@anticrm/workbench'
  import recruiting from '@anticrm/recruiting'
  import { Label, ActionIcon } from '@anticrm/ui'

  import ActionPresenter from '../vacancies/ActionPresenter.svelte'

  import Dots from '../icons/Dots.svelte'
  import { ApplicantUIModel } from '../..'

  export let doc: ApplicantUIModel

  $: actions = doc.stateData.optionalActionsData.concat(doc.stateData.requiredActionsData)

  function onClick (): void {
    selectDocument(doc)
  }
</script>

<div class="root" on:click={onClick}>
  <div class="header" class:noContent={actions.length === 0}>
    <div class="candidate">
      <div class="candidate-avatar">
        <img width="100%" height="100%" src={doc.candidateData.avatar} alt="avatar" />
      </div>
      <div class="candidate-info">
        <div class="candidate-title">
          <Label label={recruiting.string.Candidate} />
        </div>
        <div class="candidate-name">
          {`${doc.candidateData.firstName} ${doc.candidateData.lastName}`}
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
</div>

<style lang="scss">
  .root {
    display: flex;
    flex-direction: column;

    gap: 10px;
    min-height: 70px;

    background-color: var(--theme-button-bg-hovered);
    border: 1px solid var(--theme-bg-accent-color);
    border-radius: 12px;
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
