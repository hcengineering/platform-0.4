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
  import type { Ref, Space } from '@anticrm/core'
  import task from '../plugin'
  import { getClient } from '@anticrm/workbench'
  import { onDestroy } from 'svelte'
  import { Task, TaskComment } from '@anticrm/task'
  import Comments from './Comments.svelte'

  export let currentSpace: Ref<Space>
  export let taskId: Ref<Task>

  const client = getClient()
  let messages: TaskComment[] = []

  function addMessage (message: string): void {
    client.createDoc(task.class.TaskComment, currentSpace, {
      message,
      task: taskId
    })
  }

  let unsubscribe = () => {}

  $: if (currentSpace !== undefined) {
    unsubscribe()
    unsubscribe = client.query(task.class.TaskComment, { space: currentSpace }, (result) => {
      messages = result
    })
  }

  onDestroy(() => {
    unsubscribe()
  })
</script>

<Comments {messages} on:message={(event) => addMessage(event.detail)} />
