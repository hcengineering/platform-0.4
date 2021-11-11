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
  import ui, { ActionIcon, closePopup, showPopup, UserInfo } from '@anticrm/ui'
  import type { Task } from '@anticrm/task'
  import task from '@anticrm/task'
  import MoreH from './icons/MoreH.svelte'
  import Chat from './icons/Chat.svelte'
  import core, { Space } from '@anticrm/core'
  import type { Account, Ref } from '@anticrm/core'
  import { SpaceLastViews } from '@anticrm/notification'
  import { getContext } from 'svelte'
  import { Writable } from 'svelte/store'
  import { getClient } from '@anticrm/workbench'
  import EditTask from './EditTask.svelte'

  export let doc: Task
  const spacesLastViews = getContext('spacesLastViews') as Writable<Map<Ref<Space>, SpaceLastViews>>

  $: spaceLastViews = $spacesLastViews.get(doc.space)

  const client = getClient()

  async function getUser (assignee: Ref<Account> | undefined): Promise<Account | undefined> {
    if (assignee === undefined) return undefined
    return (await client.findAll(core.class.Account, { _id: assignee })).pop()
  }

  function select () {
    showPopup(EditTask, { id: doc._id }, 'full', () => {
      closePopup()
    })
  }

  function isNew (card: Task, spaceLastViews: SpaceLastViews | undefined): boolean {
    if (spaceLastViews === undefined) return false
    if (spaceLastViews.objectLastReads instanceof Map) {
      const lastRead = spaceLastViews.objectLastReads.get(card._id)
      if (lastRead === undefined) return false
      if (card.modifiedOn > lastRead) return true
      if ((card.lastModified ?? 0) > lastRead) return true
    }
    return false
  }

  function isNotificated (card: Task, spaceLastViews: SpaceLastViews | undefined): boolean {
    if (spaceLastViews === undefined) return false
    if (spaceLastViews.notificatedObjects.includes(card._id)) return true
    for (const comment of card.comments) {
      if (spaceLastViews.notificatedObjects.includes(comment._id)) return true
    }
    return false
  }
</script>

<div
  class="card-container"
  class:isNew={isNew(doc, spaceLastViews) || isNotificated(doc, spaceLastViews)}
  class:isNotificated={isNotificated(doc, spaceLastViews)}
>
  <div class="header">{doc.name}</div>
  <div class="footer">
    {#await getUser(doc.assignee) then user}
      <UserInfo {user} size={24} avatarOnly />
    {/await}
    <div class="actions">
      <ActionIcon size={24} icon={Chat} label={task.string.Comments} action={() => select()} />
      <div class="counter">{doc.comments.length}</div>
      <ActionIcon size={24} icon={MoreH} label={ui.string.More} action={() => select()} />
    </div>
  </div>
</div>

<style lang="scss">
  .card-container {
    display: flex;
    flex-direction: column;
    padding: 16px;
    color: var(--theme-caption-color);
    background-color: var(--theme-button-bg-hovered);
    border: 1px solid var(--theme-bg-accent-color);
    border-radius: 12px;

    &.isNew {
      background-color: var(--theme-bg-accent-press);
    }

    &.isNotificated {
      border-color: var(--theme-bg-focused-border);
    }

    .header {
      margin-bottom: 16px;
    }

    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .actions {
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        align-items: center;

        .counter {
          margin-left: 2px;
          margin-right: 12px;
          color: var(--theme-caption-color);
        }
      }
    }
  }
</style>
