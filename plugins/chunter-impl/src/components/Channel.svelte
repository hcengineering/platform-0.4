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
  import type { Message as MessageModel } from '@anticrm/chunter'
  import type { Account, Ref, Timestamp } from '@anticrm/core'
  import Message from './Message.svelte'

  export let messages: MessageData[] = []
  let div: HTMLElement

  interface MessageData {
    _id: Ref<MessageModel>
    message: string
    modifiedOn: Timestamp
    createOn: Timestamp
    modifiedBy: Ref<Account>
  }
</script>

<div class="channel-container" bind:this={div}>
  {#each messages as m (m._id)}
    <Message message={m} />
  {/each}
</div>

<style lang="scss">
  .channel-container {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
  }
</style>
