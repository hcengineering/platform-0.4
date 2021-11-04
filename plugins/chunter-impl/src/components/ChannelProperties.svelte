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
  import type { Channel } from '@anticrm/chunter'
  import { Component, Dialog, EditBox, Grid, Icon, Label, Tabs, ToggleWithLabel } from '@anticrm/ui'
  import workbench, { getClient } from '@anticrm/workbench'
  import chunter from '../plugin'

  const client = getClient()

  export let space: Channel
  let updatedSpace: Channel

  $: {
    if (updatedSpace === undefined) {
      updatedSpace = space
    }
  }

  let lq: QueryUpdater<Channel> | undefined

  $: lq = client.query(lq, space._class, { _id: space._id }, (q) => {
    updatedSpace = q[0]
  })

  const tabs = [chunter.string.General, chunter.string.ChannelMembers, chunter.string.Activity]
  let selectedTab: IntlString = chunter.string.General

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
        <Icon size={16} icon={chunter.icon.Chunter} />
        <span>{updatedSpace.name}</span>
      </div>
      <div class="description">
        {updatedSpace.description}
      </div>
    </div>
  </svelte:fragment>

  <Tabs {tabs} bind:selected={selectedTab} />

  {#if selectedTab === chunter.string.General}
    <Grid column={1}>
      <EditBox
        label={chunter.string.ChannelName}
        bind:value={space.name}
        on:blur={(e) => {
          update('name', space.name)
        }}
      />

      <EditBox
        label={chunter.string.ChannelDescription}
        bind:value={space.description}
        on:blur={(e) => {
          update('description', space.description)
        }}
      />
      <div class="attachments">
        <div class="header">
          <Label label={attachment.string.Attachments} />
        </div>
        <Component
          is={attachment.component.Attachments}
          props={{ objectId: space._id, objectClass: space._class, space: space._id }}
        />
      </div>
    </Grid>
  {:else if selectedTab === chunter.string.ChannelMembers}
    <div class="section">
      <ToggleWithLabel
        label={chunter.string.MakePrivate}
        description={chunter.string.MakePrivateDescription}
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
    .header {
      font-size: 20px;
    }
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
