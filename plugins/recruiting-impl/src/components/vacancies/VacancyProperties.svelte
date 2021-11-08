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
  import attachment from '@anticrm/attachment'
  import type { QueryUpdater } from '@anticrm/presentation'
  import type { IntlString } from '@anticrm/status'
  import type { VacancySpace } from '@anticrm/recruiting'
  import { Component, Dialog, EditBox, Grid, Icon, Tabs, ToggleWithLabel } from '@anticrm/ui'
  import workbench, { getClient } from '@anticrm/workbench'
  import recruiting from '@anticrm/recruiting'
  import VacancyHeader from './VacancyHeader.svelte'

  const client = getClient()

  export let space: VacancySpace
  let updatedSpace: VacancySpace

  $: {
    if (updatedSpace === undefined) {
      updatedSpace = space
    }
  }

  let lq: QueryUpdater<VacancySpace> | undefined

  $: lq = client.query(lq, space._class, { _id: space._id }, (q) => {
    updatedSpace = q[0]
  })

  const tabs = [recruiting.string.General, recruiting.string.Members, recruiting.string.Activity]
  let selectedTab: IntlString = recruiting.string.General

  async function update (key: string, value: any): Promise<void> {
    if (updatedSpace !== undefined) {
      const operations = {
        [key]: value === null ? undefined : value
      }
      await client.updateDoc(updatedSpace._class, updatedSpace.space, updatedSpace._id, operations)
    }
  }
</script>

<Dialog on:close withCancel={false} withOk={false}>
  <svelte:fragment slot="header">
    <div class="flex-row">
      <div class="title">
        <Icon size={16} icon={recruiting.icon.Recruiting} />
        <span>{updatedSpace.name}</span>
      </div>
      <div class="description">
        {updatedSpace.description}
      </div>
    </div>
  </svelte:fragment>
  <svelte:fragment slot="actions">
    <VacancyHeader
      bind:vacancy={updatedSpace}
      on:update={(e) => {
        update(e.detail.key, e.detail.value)
      }}
    />
  </svelte:fragment>

  <Tabs {tabs} bind:selected={selectedTab} />

  {#if selectedTab === recruiting.string.General}
    <Grid column={1}>
      <EditBox
        label={recruiting.string.FolderName}
        bind:value={space.name}
        on:blur={() => {
          update('name', space.name)
        }}
      />

      <EditBox
        label={recruiting.string.FolderDescription}
        bind:value={space.description}
        on:blur={() => {
          update('description', space.description)
        }}
      />
      <div class="attachments">
        <Component
          is={attachment.component.Attachments}
          props={{ objectId: space._id, objectClass: space._class, space: space._id, editable: true }}
        />
      </div>
    </Grid>
  {:else if selectedTab === recruiting.string.Members}
    <div class="section">
      <ToggleWithLabel
        label={recruiting.string.MakePrivate}
        description={recruiting.string.MakePrivateDescription}
        bind:on={space.private}
        on:change={() => {
          update('private', space.private)
        }}
      />
    </div>
    <div class="content">
      <Component is={workbench.component.MembersSection} props={{ space: updatedSpace }} />
    </div>
  {:else}
    TODO: Not yet implemented.
  {/if}
</Dialog>

<style lang="scss">
  .title {
    display: flex;
    align-items: center;
    font-size: 16px;
    line-height: 24px;
    span {
      margin-left: 10px;
    }
  }
  .description {
    font-size: 12px;
    opacity: 0.4;
  }
  .attachments {
    display: flex;
    flex-direction: column;
  }
  .section {
    border-bottom: 1px solid var(--theme-dialog-divider);
    margin-top: 20px;
    padding-bottom: 40px;
  }

  .content {
    margin-top: 10px;
    margin-bottom: 10px;
  }
</style>
