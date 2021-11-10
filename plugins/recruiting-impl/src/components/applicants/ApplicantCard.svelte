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
  import { ActionIcon, closePopup, showPopup, Component } from '@anticrm/ui'
  import ApplicantPresenter from './ApplicantPresenter.svelte'
  import attachment from '@anticrm/attachment'
  import chunter from '@anticrm/chunter'

  import ActionPresenter from '../vacancies/ActionPresenter.svelte'

  import Dots from '../icons/Dots.svelte'
  import { ApplicantUIModel } from '../..'

  export let doc: ApplicantUIModel

  $: actions = doc.stateData.optionalActionsData.concat(doc.stateData.requiredActionsData)

  function onClick (): void {
    showPopup(ApplicantPresenter, { id: doc._id }, 'full', () => {
      closePopup()
    })
  }
</script>

<div class="root" on:click={onClick}>
  <div class="header">
    <div class="candidate">
      <div class="candidate-avatar">
        {#if doc.candidateData.avatar}
          <img width="100%" height="100%" src={doc.candidateData.avatar} alt="avatar" />
        {/if}
      </div>
      <div class="candidate-info">
        <div class="candidate-name">
          {`${doc.candidateData.firstName} ${doc.candidateData.lastName}`}
        </div>
        <div class="candidate-title">
          {doc.candidateData.title ?? ''}
        </div>
      </div>
    </div>
    <ActionIcon icon={Dots} size={16} />
  </div>
  {#if actions.length > 0}
    <div class="actions">
      {#each actions as action (action._id)}
        <div class="action">
          <ActionPresenter {action} target={doc} />
        </div>
      {/each}
    </div>
  {/if}
  <div class="footer">
    <div class="footer-left">
      <Component is={attachment.component.AttachmentsTableCell} props={{ attachments: [] }} />
      <Component is={chunter.component.CommentsTableCell} props={{ comments: doc.comments }} />
    </div>
  </div>
</div>

<style lang="scss">
  .root {
    position: relative;
    display: flex;
    flex-direction: column;

    gap: 10px;
    min-height: 72px;
    padding: 16px 0;
  }

  .header {
    display: flex;
    justify-content: space-between;

    height: 40px;
    padding: 0 20px;
  }

  .candidate {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
  }

  .candidate-avatar {
    width: 40px;
    height: 40px;

    border-radius: 50%;
    overflow: hidden;

    pointer-events: none;
  }

  .candidate-info {
    display: flex;
    flex-direction: column;

    color: var(--theme-caption-color);
  }

  .candidate-title {
    font-weight: 400;
    opacity: 0.6;
  }

  .candidate-name {
    font-weight: 500;
    font-size: 16px;
  }

  .actions {
    display: flex;
    flex-direction: column;

    gap: 15px;
    margin: 15px 0;

    border: 1px solid var(--theme-bg-accent-color);
    border-style: solid none;
  }

  .action {
    display: flex;
    align-items: center;
    margin: 15px 20px;
    border-bottom: 1px solid var(--theme-bg-accent-color);

    height: 75px;
    min-height: 75px;

    &:last-child {
      border-bottom: unset;
    }
  }

  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;

    height: 24px;
    padding: 0 20px;
  }

  .footer-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }
</style>
