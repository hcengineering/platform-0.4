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
  import { Channel, ReferenceInput } from '@anticrm/chunter-impl'
  import type { Account, Ref, Timestamp } from '@anticrm/core'
  import type { Message as MessageModel } from '@anticrm/chunter'

  export let messages: Message[] = []

  interface Message {
    _id: Ref<MessageModel>
    message: string
    modifiedOn: Timestamp
    createOn: Timestamp
    modifiedBy: Ref<Account>
  }
</script>

<div class="msg-board">
  <Channel {messages} thread />
</div>
<ReferenceInput withoutMargin={true} on:message />

<style lang="scss">
  .msg-board {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    margin-top: 20px;
  }
</style>
