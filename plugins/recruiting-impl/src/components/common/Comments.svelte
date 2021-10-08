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
  import { getFullRef, SortingOrder } from '@anticrm/core'
  import type { Doc } from '@anticrm/core'
  import { QueryUpdater } from '@anticrm/presentation'
  import { getClient } from '@anticrm/workbench'
  import { Component } from '@anticrm/ui'
  import chunter from '@anticrm/chunter'
  import type { Comment } from '@anticrm/chunter'

  export let target: Doc
  let ref = ''
  $: ref = getFullRef(target._id, target._class)

  const client = getClient()

  let msgs: Comment[] = []
  let msgsQ: QueryUpdater<Comment> | undefined

  $: msgsQ = client.query(
    msgsQ,
    chunter.class.Comment,
    { space: target.space, replyOf: ref },
    (result) => (msgs = result),
    { sort: { createOn: SortingOrder.Ascending } }
  )

  function onAddMessage (e: any): void {
    client.createDoc(chunter.class.Comment, target.space, {
      message: e.detail,
      replyOf: ref
    })
  }
</script>

<div class="msg-board">
  <Component is={chunter.component.Channel} props={{ messages: msgs, thread: true }} />
</div>
<Component
  is={chunter.component.ReferenceInput}
  props={{ currentSpace: target.space, thread: true }}
  on:message={onAddMessage}
/>

<style lang="scss">
  .msg-board {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    margin-top: 20px;
  }
</style>
