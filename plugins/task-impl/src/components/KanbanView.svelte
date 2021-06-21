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
  import KanbanPanel from './KanbanPanel.svelte'
  import KanbanCard from './KanbanCard.svelte'
  import KanbanTask from './KanbanTask.svelte'

  import Calendar from './icons/Calendar.svelte'
  import Call from './icons/Call.svelte'
  import Document from './icons/Document.svelte'
  import Task from './icons/Task.svelte'

  export let kanban: Array<Object> =
             [{title: 'Introduction', counter: 4, cards:
                  [{user: 'elon', tasks:
                        [{icon: Document, title: 'Offer sent', text: '8:30AM, July 12 Voltron, San Francisco'}, 
                         {icon: Task, title: 'Discuss offer details', text: 'This is a small description for this application and great.'}]},
                   {user: 'tim', tasks:
                        [{icon: Document, title: 'Send offer', text: '8:30AM, July 12'}]}]},
               {title: 'Interview', counter: 16, color: '#9D92C4', cards:
                  [{user: 'chen', tasks:
                        [{icon: Calendar, title: 'Team Interview', text: '8:30AM, July 12 Voltron, San Francisco'}]},
                   {user: 'kathryn', tasks:
                        [{icon: Call, title: 'Team Interview', text: '8:30AM, July 12 Voltron, San Francisco'}]}]},
               {title: 'Introduction', counter: 4, cards:
                  [{user: 'elon', tasks:
                        [{icon: Document, title: 'Offer sent', text: '8:30AM, July 12 Voltron, San Francisco'}, 
                         {icon: Document, title: 'Offer sent', text: '8:30AM, July 12 Voltron, San Francisco'}, 
                         {icon: Task, title: 'Discuss offer details', text: 'This is a small description for this application and great.'}]},
                   {user: 'chen', tasks:
                        [{icon: Calendar, title: 'Team Interview', text: '8:30AM, July 12 Voltron, San Francisco'}]},
                   {user: 'tim', tasks:
                        [{icon: Document, title: 'Send offer', text: '8:30AM, July 12 Voltron, San Francisco'}]}]},
               {title: 'Interview', counter: 16, color: '#9D92C4', cards:
                  [{user: 'chen', tasks:
                        [{icon: Calendar, title: 'Team Interview', text: '8:30AM, July 12 Voltron, San Francisco'}]},
                   {user: 'kathryn', tasks:
                        [{icon: Call, title: 'Team Interview', text: '8:30AM, July 12 Voltron, San Francisco'}]}]},
               {title: 'Interview', counter: 16, color: '#9D92C4', cards:
                  [{user: 'chen', tasks:
                        [{icon: Calendar, title: 'Team Interview', text: '8:30AM, July 12 Voltron, San Francisco'}]},
                   {user: 'kathryn', tasks:
                        [{icon: Call, title: 'Team Interview', text: '8:30AM, July 12 Voltron, San Francisco'}]}]}]
</script>

{#each kanban as kbItem}
  <KanbanPanel title={kbItem.title} counter={kbItem.counter} color={kbItem.color}>
    {#each kbItem.cards as card}
      <KanbanCard user={card.user}>
        {#each card.tasks as task}
          <KanbanTask icon={task.icon} title={task.title} text={task.text}/>
        {/each}
      </KanbanCard>
    {/each}
  </KanbanPanel>
{/each}
