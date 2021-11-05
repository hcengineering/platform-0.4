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
  import chunter, { Comment } from '@anticrm/chunter'
  import { Ref } from '@anticrm/core'
  import { showPopup } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import CommentsPopup from './CommentsPopup.svelte'
  import Chat from './icons/Chat.svelte'

  export let comments: Ref<Comment>[]
  const client = getClient()

  async function open (e: MouseEvent): Promise<void> {
    const items = await client.findAll(chunter.class.Comment, { _id: { $in: comments } })
    if (items.length > 0) {
      e.stopPropagation()
      showPopup(CommentsPopup, { comments: items }, e.target as HTMLElement)
    }
  }
</script>

<div class="flex-row-center" on:click={open}>
  <Chat />
  {comments.length}
</div>
