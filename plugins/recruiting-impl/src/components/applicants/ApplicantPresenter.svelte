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
  import attachment, { Attachment } from '@anticrm/attachment'
  import { Account, generateId, getFullRef, Ref, Space } from '@anticrm/core'
  import core from '@anticrm/core'
  import chunter, { Comment } from '@anticrm/chunter'
  import type { State } from '@anticrm/fsm'
  import fsm from '@anticrm/fsm'
  import type { QueryUpdater } from '@anticrm/presentation'
  import type { Applicant, Candidate, VacancySpace } from '@anticrm/recruiting'
  import recruiting from '@anticrm/recruiting'
  import { Panel, Component, ActionIcon, IconFile, UserBox, Label } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import StateViewer from './StateViewer.svelte'
  import SocialLinks from '../candidates/SocialLinks.svelte'
  import AvatarView from '../candidates/AvatarView.svelte'
  import { NotificationClient, SpaceLastViews } from '@anticrm/notification'
  import { getContext, onDestroy } from 'svelte'
  import { Writable } from 'svelte/store'

  export let id: Ref<Applicant>
  let spaceLastViews: SpaceLastViews | undefined

  const client = getClient()
  const notificationClient = new NotificationClient(client)
  const spacesLastViews = getContext('spacesLastViews') as Writable<Map<Ref<Space>, SpaceLastViews>>
  let applicant: Applicant | undefined
  let lqApplicant: QueryUpdater<Applicant> | undefined
  $: lqApplicant = client.query(lqApplicant, recruiting.class.Applicant, { _id: id }, async (result) => {
    if (applicant !== undefined) {
      const spaceLastViews = $spacesLastViews.get(applicant.space)
      if (spaceLastViews !== undefined) {
        await notificationClient.readNow(spaceLastViews, applicant._id)
      }
    }
    applicant = result[0]
    spaceLastViews = $spacesLastViews.get(applicant.space)
  })

  onDestroy(async () => {
    if (applicant !== undefined) {
      const spaceLastViews = $spacesLastViews.get(applicant.space)
      if (spaceLastViews !== undefined) {
        await notificationClient.readNow(spaceLastViews, id)
      }
    }
  })

  let candidate: Candidate | undefined
  let lqCandidate: QueryUpdater<Candidate> | undefined

  $: if (applicant !== undefined) {
    lqCandidate = client.query(
      lqCandidate,
      recruiting.class.Candidate,
      { _id: applicant.item as Ref<Candidate> },
      (result) => {
        candidate = result[0]
      }
    )
  } else {
    lqCandidate?.unsubscribe()
    lqCandidate = undefined
    candidate = undefined
  }

  let vacancy: VacancySpace | undefined
  let vacancyQ: QueryUpdater<VacancySpace> | undefined
  $: if (applicant !== undefined) {
    vacancyQ = client.query(
      vacancyQ,
      recruiting.class.VacancySpace,
      { _id: applicant.space as Ref<VacancySpace> },
      (result) => {
        vacancy = result.shift()
      }
    )
  } else {
    vacancyQ?.unsubscribe()
    vacancyQ = undefined
    vacancy = undefined
  }

  let recruiters: Account[]
  $: recruiter = applicant?.recruiter
  let recruitersQ: QueryUpdater<Account> | undefined
  $: if (vacancy !== undefined) {
    recruitersQ = client.query(recruitersQ, core.class.Account, { _id: { $in: vacancy.members } }, (res) => {
      recruiters = res
    })
  } else {
    recruitersQ?.unsubscribe()
    recruitersQ = undefined
    recruiters = []
  }

  let state: State | undefined
  let stateQ: QueryUpdater<State> | undefined
  $: if (applicant !== undefined) {
    stateQ = client.query(
      stateQ,
      fsm.class.State,
      { _id: applicant.state },
      (res) => {
        state = res.shift()
      },
      { limit: 1 }
    )
  }

  let attachments: Ref<Attachment>[] = []
  let attachmentsQ: QueryUpdater<Attachment> | undefined
  $: if (vacancy !== undefined) {
    attachmentsQ = client.query(
      attachmentsQ,
      attachment.class.Attachment,
      { attachTo: getFullRef(vacancy._id, vacancy._class) },
      (res) => {
        attachments = res.map((r) => r._id)
      }
    )
  }

  async function changeRecruiter (): Promise<void> {
    if (applicant === undefined || recruiter == null) return
    await client.updateDoc(applicant._class, applicant.space, applicant._id, {
      recruiter: recruiter
    })
    if (spaceLastViews !== undefined) {
      await notificationClient.readNow(spaceLastViews, applicant._id, true)
    }
  }

  let newCommentId: Ref<Comment> = generateId()
  async function addMessage (applicant: Applicant | undefined, evt: any): Promise<void> {
    if (applicant === undefined) {
      return
    }
    await client.createDoc(
      chunter.class.Comment,
      applicant.space,
      {
        message: evt.detail as string,
        replyOf: getFullRef(applicant._id, applicant._class)
      },
      newCommentId
    )
    newCommentId = generateId()
    const spaceLastViews = $spacesLastViews.get(applicant.space)
    if (spaceLastViews !== undefined) {
      await notificationClient.readNow(spaceLastViews, applicant._id, true)
    }
  }
</script>

{#if applicant && candidate && vacancy && recruiter && state}
  <Panel on:close>
    <svelte:fragment slot="header">
      <ActionIcon icon={IconFile} circleSize={36} size={16} />
      <div class="header">
        <div class="name">
          {candidate.firstName}
          {candidate.lastName}
        </div>
        <div>
          {vacancy.name}
        </div>
      </div>
    </svelte:fragment>
    <svelte:fragment slot="actions">
      <UserBox
        title={recruiting.string.AssignRecruiter}
        users={recruiters}
        bind:selected={recruiter}
        on:change={changeRecruiter}
      />
      <StateViewer {state} width={60} height={28} />
    </svelte:fragment>

    <div class="flex">
      <div class="card flex-col">
        <div class="title">
          <Label label={recruiting.string.Candidate} />
        </div>
        <AvatarView
          src={candidate.avatar}
          objectId={candidate._id}
          objectClass={candidate._class}
          space={candidate.space}
          size={'small'}
          editable={false}
        />
        <div class="name">
          {candidate.firstName}
          {candidate.lastName}
        </div>
        <div>
          {candidate.title}
        </div>
        <div>
          {candidate.address.city}
        </div>
        <div class="additionals">
          <SocialLinks value={candidate.socialLinks} />
        </div>
      </div>
      <div class="card flex-col">
        <div class="title">
          <Label label={recruiting.string.Vacancy} />
        </div>
        <div class="icon flex-center">
          <div>
            <IconFile />
          </div>
        </div>
        <div class="name">
          {vacancy.name}
        </div>
        <div>
          {vacancy.company}
        </div>
        <div>
          {vacancy.location}
        </div>
        <div class="additionals">
          <Component is={attachment.component.AttachmentsTableCell} props={{ attachments: attachments }} />
        </div>
      </div>
    </div>

    <Component
      is={attachment.component.Attachments}
      props={{
        objectId: applicant._id,
        objectClass: recruiting.class.Applicant,
        space: applicant.space,
        editable: true
      }}
    />

    <svelte:fragment slot="ref-input">
      <Component
        is={chunter.component.ReferenceInput}
        props={{
          currentSpace: applicant.space,
          objectClass: chunter.class.Comment,
          objectId: newCommentId,
          thread: true
        }}
        on:message={(evt) => addMessage(applicant, evt)}
      />
    </svelte:fragment>
  </Panel>
{/if}

<style lang="scss">
  .header {
    margin-left: 8px;
  }
  .name {
    font-size: 16px;
    font-weight: 500;
    color: var(--theme-caption-color);
  }

  .card {
    border-radius: 12px;
    border: 1px solid var(--theme-bg-accent-color);
    background-color: var(--theme-button-bg-enabled);
    padding: 16px 24px 24px 24px;

    .name {
      margin-top: 16px;
      margin-bottom: 4px;
    }

    .title {
      text-transform: capitalize;
      margin-bottom: 28px;
    }

    .additionals {
      margin-top: 24px;
    }

    .icon {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background-color: var(--primary-button-enabled);
    }
  }

  .card + .card {
    margin: 0 24px;
  }
</style>
