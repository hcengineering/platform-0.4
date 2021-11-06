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
  import calendar from '@anticrm/calendar'
  import type { QueryUpdater } from '@anticrm/presentation'
  import type { IntlString } from '@anticrm/status'
  import type { Project } from '@anticrm/task'
  import { ActionIcon, Component, Dialog, EditBox, Grid, Icon, Tabs, ToggleWithLabel } from '@anticrm/ui'
  import workbench, { getClient } from '@anticrm/workbench'
  import task from '../plugin'
  import StatusPicker from './StatusPicker.svelte'

  const client = getClient()

  export let space: Project
  let updatedSpace: Project

  $: {
    if (updatedSpace === undefined) {
      updatedSpace = space
    }
  }

  let lq: QueryUpdater<Project> | undefined

  $: lq = client.query(lq, space._class, { _id: space._id }, (q) => {
    updatedSpace = q[0]
  })

  const tabs = [task.string.General, task.string.ProjectMembers, task.string.Activity]
  let selectedTab: IntlString = task.string.General

  async function update (key: string, value: any): Promise<void> {
    if (updatedSpace !== undefined) {
      const operations = {
        [key]: value === null ? undefined : value
      }
      await client.updateDoc(updatedSpace._class, updatedSpace.space, updatedSpace._id, operations)
    }
  }
  function toIntlString (value: string): IntlString {
    return value as IntlString
  }
</script>

<Dialog on:close withCancel={false} withOk={false}>
  <svelte:fragment slot="header">
    <div class="flex-row">
      <div class="title">
        <Icon size={16} icon={task.icon.Project} />
        <span>{updatedSpace.name}</span>
      </div>
      <div class="description">
        {updatedSpace.description}
      </div>
    </div>
  </svelte:fragment>
  <svelte:fragment slot="actions">
    <div class="flex">
      <ActionIcon size={16} icon={calendar.icon.Calendar} circleSize={36} />
    </div>
    <StatusPicker selected={toIntlString('Status')} on:change={(e) => {}} />
  </svelte:fragment>

  <Tabs {tabs} bind:selected={selectedTab} />

  {#if selectedTab === task.string.General}
    <Grid column={1}>
      <EditBox
        label={task.string.ProjectName}
        bind:value={space.name}
        on:blur={(e) => {
          update('name', space.name)
        }}
      />

      <EditBox
        label={task.string.ProjectDescription}
        bind:value={space.description}
        on:blur={(e) => {
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
  {:else if selectedTab === task.string.ProjectMembers}
    <div class="section">
      <ToggleWithLabel
        label={task.string.MakePrivate}
        description={task.string.MakePrivateDescription}
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
