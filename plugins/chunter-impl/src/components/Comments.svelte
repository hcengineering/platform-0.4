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
  import { getFullRef, SortingOrder } from '@anticrm/core'
  import type { Message as MessageModel, Comment } from '@anticrm/chunter'
  import type { QueryUpdater } from '@anticrm/presentation'
  import { getClient } from '@anticrm/workbench'
  import { afterUpdate, createEventDispatcher } from 'svelte'
  import chunter from '../plugin'
  import Message from './Message.svelte'

  export let message: MessageModel

  const client = getClient()
  let query: QueryUpdater<Comment> | undefined

  const dispatch = createEventDispatcher()
  afterUpdate(async () => {
    dispatch('update')
  })

  let comments: Comment[] = []
  $: {
    query = client.query(
      query,
      chunter.class.Comment,
      { replyOf: getFullRef(message._id, message._class) },
      (result) => {
        comments = result
      },
      {
        sort: { createOn: SortingOrder.Ascending }
      }
    )
  }
</script>

<div class="channel-container">
  {#each comments as m (m._id)}
    <Message thread message={m} />
  {/each}
</div>

<style lang="scss">
  .channel-container {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
  }
</style>
