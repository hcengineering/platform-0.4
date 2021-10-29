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
  import { generateId, getFullRef, SortingOrder } from '@anticrm/core'
  import type { Ref, Space } from '@anticrm/core'
  import { getClient } from '@anticrm/workbench'
  import type { Task } from '@anticrm/task'
  import Comments from './Comments.svelte'
  import task from '../plugin'
  import chunter from '@anticrm/chunter'
  import type { Comment } from '@anticrm/chunter'
  import type { QueryUpdater } from '@anticrm/presentation'
  import { NotificationClient, SpaceLastViews } from '@anticrm/notification'
  import { getContext } from 'svelte'
  import { Writable } from 'svelte/store'

  const spacesLastViews = getContext('spacesLastViews') as Writable<Map<Ref<Space>, SpaceLastViews>>

  export let currentSpace: Ref<Space>
  export let taskId: Ref<Task>

  const client = getClient()
  const notificationClient = new NotificationClient(client)
  let messages: Comment[] = []
  let newCommentId: Ref<Comment> = generateId()

  async function addMessage (message: string): Promise<void> {
    await client.createDoc(chunter.class.Comment, currentSpace, {
      message,
      replyOf: getFullRef(taskId, task.class.Task)
      },
      newCommentId
    )
    newCommentId = generateId()
    const spaceLastViews = $spacesLastViews.get(currentSpace)
    if (spaceLastViews !== undefined) {
      await notificationClient.readNow(spaceLastViews, taskId, true)
    }
  }

  let query: QueryUpdater<Comment> | undefined

  $: {
    query = client.query(
      query,
      chunter.class.Comment,
      { space: currentSpace, replyOf: getFullRef(taskId, task.class.Task) },
      (result) => {
        messages = result
      },
      {
        sort: { createOn: SortingOrder.Ascending }
      }
    )
  }
</script>

<Comments
  {messages}
  {currentSpace}
  objectClass={chunter.class.Comment}
  objectId={newCommentId}
  on:message={(event) => addMessage(event.detail)}
/>
