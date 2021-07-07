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
  import type { Asset } from '@anticrm/status'
  import type { AnySvelteComponent } from '@anticrm/ui'

  import KanbanPanel from './KanbanPanel.svelte'
  import KanbanCard from './KanbanCard.svelte'
  import KanbanTask from './KanbanTask.svelte'

  import Calendar from './icons/Calendar.svelte'
  import Call from './icons/Call.svelte'
  import Document from './icons/Document.svelte'
  import Task from './icons/Task.svelte'

  interface ITask {
    icon: Asset | AnySvelteComponent
    title: string
    text: string
  }

  interface ICard {
    _id: number
    user: string
    category: number
    tasks?: Array<ITask>
    onDrag?: boolean
  }

  interface ICategory {
    _id: number
    title: string
    counter?: number
    color?: string
  }

  export let categories: Array<ICategory> = [{ _id: 1, title: 'Introduction', counter: 4 },
                                             { _id: 2, title: 'Interview', counter: 16, color: '#9D92C4' },
                                             { _id: 3, title: 'Submissions', counter: 4, color: '#61A6AF' },
                                             { _id: 4, title: 'On Site', counter: 8, color: '#73A6CD' }]
  export let cards: Array<ICard> = [{ _id: 1, user: 'elon', category: 1, tasks:
                                        [{ icon: Document, title: 'Offer sent', text: '8:30AM, July 12 Voltron, San Francisco' },
                                         { icon: Task, title: 'Discuss offer details', text: 'This is a small description for this application and great.' }]},
                                    { _id: 2, user: 'tim', category: 1, tasks:
                                        [{ icon: Document, title: 'Send offer', text: '8:30AM, July 12 Voltron, San Francisco' }] },
                                    { _id: 3, user: 'chen', category: 2, tasks:
                                        [{ icon: Calendar, title: 'Team Interview', text: '8:30AM, July 12 Voltron, San Francisco' }] },
                                    { _id: 4, user: 'kathryn', category: 2, tasks:
                                        [{ icon: Call, title: 'Team Interview', text: '8:30AM, July 12 Voltron, San Francisco' }] },
                                    { _id: 5, user: 'elon', category: 3, tasks:
                                        [{ icon: Document, title: 'Team Interview', text: '8:30AM, July 12 Voltron, San Francisco' },
                                         { icon: Task, title: 'Team Interview', text: '8:30AM, July 12 Voltron, San Francisco' },
                                         { icon: Call, title: 'Team Interview', text: '8:30AM, July 12 Voltron, San Francisco' },
                                         { icon: Calendar, title: 'Team Interview', text: '8:30AM, July 12 Voltron, San Francisco' }] },
                                    { _id: 6, user: 'tim', category: 4, tasks:
                                        [{ icon: Document, title: 'Send offer', text: '8:30AM, July 12 Voltron, San Francisco' }] },
                                    { _id: 7, user: 'chen', category: 4, tasks:
                                        [{ icon: Calendar, title: 'Team Interview', text: '8:30AM, July 12 Voltron, San Francisco' }] },
                                    { _id: 8, user: 'kathryn', category: 4, tasks:
                                        [{ icon: Call, title: 'Team Interview', text: '8:30AM, July 12 Voltron, San Francisco' }] }]

  let dragCard: ICard
  let onDrag: boolean = false
  let enterID: number = 0
  let dragID: number = 0

  const getCount = (id: number): number => {
    return cards.filter(card => card.category == id).length
  }
  const calculateAll = (): void => {
    categories.forEach(cat => cat.counter = getCount(cat._id))
  }
  calculateAll()
</script>

{#each categories as kbItem (kbItem._id)}
  <KanbanPanel title={kbItem.title} bind:counter={kbItem.counter} color={kbItem.color}
    on:dragover={(event) => {
      event.preventDefault()
      if (dragID > 0 && dragID !== kbItem._id) {
        cards.pop()
        dragID = 0
      }
      if (enterID !== kbItem._id && kbItem._id !== dragCard.category) {
        dragID = kbItem._id
        cards.push({ _id: 0, user: dragCard.user, category: dragID, tasks: dragCard.tasks, onDrag: true })
      }
      enterID = kbItem._id
    }}
    on:drop={(event) => {
      event.preventDefault()
      dragCard.category = kbItem._id
      dragCard.onDrag = false
      if (dragID > 0) {
        cards.pop()
        dragID = 0
      }
      kbItem.counter = getCount(kbItem._id)
      calculateAll()
    }}
  >
    {#each cards as card}
      {#if card.category === kbItem._id }
        <KanbanCard user={card.user} bind:onDrag={card.onDrag}
          draggable={true}
          on:dragstart={() => {
            kbItem.counter = getCount(kbItem._id)
            onDrag = true
            card.onDrag = true
            dragCard = card
            dragID = 0
            enterID = kbItem._id
          }}
          on:dragend={() => {
            if (dragID > 0) {
              cards.pop()
              dragID = 0
            }
            card.onDrag = false
            onDrag = false
          }}
        >
          {#each card.tasks as task}
            <KanbanTask icon={task.icon} title={task.title} text={task.text}/>
          {/each}
        </KanbanCard>
      {/if}
    {/each}
  </KanbanPanel>
{/each}
