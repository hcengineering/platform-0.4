<!--
// Copyright © 2020 Anticrm Platform Contributors.
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
  import type { IntlString } from '@anticrm/status'

  import KanbanPanel from './KanbanPanel.svelte'
  import KanbanCard from './KanbanCard.svelte'

  import { Task, TaskStatuses } from '@anticrm/task'
  import { Class, Ref, Space } from '@anticrm/core'
  import { getClient } from '@anticrm/workbench'
  import { getStatusColor } from '../plugin'
  import { onDestroy } from 'svelte'

  type ICard = Task & Draggable

  interface Draggable {
    onDrag: boolean
  }

  interface IStatus {
    title: IntlString
    color?: string
  }

  export let _class: Ref<Class<Task>>
  export let currentSpace: Ref<Space> | undefined
  const client = getClient()
  let unsubscribe = () => {}

  $: if (currentSpace !== undefined) {
    unsubscribe()
    unsubscribe = client.query(_class, { space: currentSpace }, (result) => {
      data = result.map((item) => Object.assign(item, { onDrag: false }))
    })
  }

  onDestroy(() => {
    unsubscribe()
  })

  let data: ICard[] = []
  let dragId: Ref<Task> | undefined

  const getCount = (status: IntlString): number => {
    return data.filter((card) => card.status === status).length
  }

  function getStatuses (): IStatus[] {
    const result: IStatus[] = []
    for (const key in TaskStatuses) {
      result.push({ title: TaskStatuses[key], color: getStatusColor(TaskStatuses[key]) })
    }
    return result
  }
</script>

{#each getStatuses() as status (status)}
  <KanbanPanel
    title={status.title}
    counter={getCount(status.title)}
    color={status.color}
    on:dragover={(event) => {
      event.preventDefault()
    }}
    on:drop={(event) => {
      event.preventDefault()
      const dragCard = data.find((p) => p._id === dragId)
      if (dragCard !== undefined && status.title !== dragCard.status) {
        client.updateDoc(_class, currentSpace, dragCard._id, {
          status: status.title
        })
      }
    }}
  >
    {#each data as card}
      {#if card.status === status.title}
        <KanbanCard
          title={card.name}
          commentSpace={card.commentSpace}
          user={'chen'}
          draggable={true}
          on:dragstart={() => {
            dragId = card._id
          }}
        />
      {/if}
    {/each}
  </KanbanPanel>
{/each}
