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
  import { createEventDispatcher } from 'svelte'
  import { EditBox, Dialog, TextArea, UserBox } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import { CheckListItem, TaskStatuses } from '@anticrm/task'
  import task from '../plugin'
  import core, { Account, Ref, Space, generateId } from '@anticrm/core'

  const dispatch = createEventDispatcher()

  export let space: Ref<Space>
  let name: string = ''
  let description: string = ''
  let assignee: Ref<Account> | undefined
  const checkItems: CheckListItem[] = []

  const client = getClient()

  async function create() {
    const id = generateId()
    const shortRefId = await client.createShortRef(id, task.class.Task, space)
    let spaceMembers = (await client.findAll(core.class.Space, { _id: space}))[0].members
    let commentSpace = (await client.createDoc(core.class.Space, core.space.Model, {
        name: `${shortRefId} comments`,
        description: `${shortRefId} comments`,
        private: true,
        members: spaceMembers
      }))._id

    const doc = await client.createDoc(task.class.Task, space, {
      name,
      assignee,
      description,
      checkItems,
      shortRefId,
      commentSpace,
      status: TaskStatuses.Open,
    }, id)
  }
</script>

<Dialog label={task.string.CreateTask} 
        okLabel={task.string.CreateTask} 
        okAction={create}
        on:close={() => { dispatch('close') }}>
  <div class="content">
    <div class="row"><EditBox label={task.string.TaskName} bind:value={name}/></div>
    <div class="row"><TextArea label={task.string.TaskDescription} bind:value={description}/></div>
    <div class="row"><UserBox hAlign={'right'} title={task.string.Assignee} showSearch /></div>
  </div>
</Dialog>


<style lang="scss">

  .content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    row-gap: 20px;
    
    .row {
      grid-column-start: 1;
      grid-column-end: 3;
    }
  }

</style>