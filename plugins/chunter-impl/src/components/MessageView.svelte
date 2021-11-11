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
  import type { Channel, Comment, Message, WithMessage } from '@anticrm/chunter'
  import type { Class, FullRef, Ref } from '@anticrm/core'
  import { parseFullRef } from '@anticrm/core'
  import { QueryUpdater } from '@anticrm/presentation'
  import { getClient, showSideDocument } from '@anticrm/workbench'
  import type { WorkbenchRoute, Application } from '@anticrm/workbench'
  import { getRouter } from '@anticrm/ui'

  import chunter from '../plugin'
  import MessageViewer from './Message.svelte'
  import SpaceItem from './SpaceItem.svelte'

  export let objectId: Ref<Message>
  export let objectClass: Ref<Class<Message>>

  let message: WithMessage | undefined
  let channel: Channel | undefined
  let replyOf: FullRef<Message> | undefined

  const client = getClient()
  const router = getRouter<WorkbenchRoute>()

  let messageQuery: QueryUpdater<WithMessage> | undefined

  $: messageQuery = client.query<WithMessage>(messageQuery, objectClass, { _id: objectId }, (result) => {
    message = result.shift()
    if (message !== undefined) {
      client.findAll(chunter.class.Channel, { _id: message.space as Ref<Channel> }).then((ch) => {
        channel = ch.shift()
      })

      if (message._class === chunter.class.Comment) {
        const replyStr = (message as Comment).replyOf
        if (replyStr !== undefined) {
          replyOf = parseFullRef(replyStr)
        }
      }
    }
  })
  const chunterApp = chunter.app.Chunter as Ref<Application>
</script>

{#if message}
  <MessageViewer {message} showReferences={false} thread={true} />
  <div class="flex-between">
    {#if channel}
      <div class="channel link-text" on:click={() => router.navigate({ app: chunterApp, space: channel?._id })}>
        <SpaceItem space={channel} />
      </div>
    {/if}
    {#if replyOf}
      <div class="link-text" on:click={() => showSideDocument(replyOf)}>View conversation</div>
    {/if}
  </div>
{/if}

<style lang="scss">
  .channel {
    margin: 10px;
    display: flex;
    flex-direction: column;
  }
</style>
