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
  import { Message as MessageModel } from '@anticrm/chunter'
  import type { Ref, Space } from '@anticrm/core'
  import { getClient } from '@anticrm/workbench'
  import { onDestroy } from 'svelte'
  import chunter from '../plugin'
  import Message from './Message.svelte'

  export let space: Ref<Space>

  const client = getClient()
  let unsubscribe = () => {}

  let messages: MessageModel[] = []
  $: if (space !== undefined) {
    unsubscribe()
    unsubscribe = client.query(chunter.class.Message, { space }, (result) => {
      messages = result
      console.log(space)
    })
  }

  onDestroy(() => {
    unsubscribe()
  })
</script>

<div class="channel-container">
  {#each messages as m (m._id)}
    <Message reactions replies name={m.modifiedBy} time={`${m.modifiedOn}`} message={m.message} />
  {/each}
</div>

<style lang="scss">
  .channel-container {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
  }
</style>
