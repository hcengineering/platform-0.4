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
  import type { Comment } from '@anticrm/chunter'
  import type { SpaceNotifications } from '@anticrm/notification'
  import type { Ref, Space } from '@anticrm/core'

  export let messages: Comment[] = []
  export let notifications: SpaceNotifications | undefined
  export let currentSpace: Ref<Space>
</script>

<div class="msg-board">
  <Channel {messages} {notifications} thread />
</div>
<ReferenceInput {currentSpace} on:message />

<style lang="scss">
  .msg-board {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    margin-top: 20px;
  }
</style>
