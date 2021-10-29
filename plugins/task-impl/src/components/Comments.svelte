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
  import chunter from '@anticrm/chunter'
  import type { Comment } from '@anticrm/chunter'
  import type { Class, Doc, Ref, Space } from '@anticrm/core'
  import { Component } from '@anticrm/ui'

  export let messages: Comment[] = []
  export let currentSpace: Ref<Space>
  export let objectClass: Ref<Class<Doc>>
  export let objectId: Ref<Doc>
</script>

<div class="msg-board">
  <Component is={chunter.component.Channel} props={{ messages, thread: true }} />
</div>
<Component
  is={chunter.component.ReferenceInput}
  props={{ currentSpace, objectClass, objectId, thread: true }}
  on:message
/>

<style lang="scss">
  .msg-board {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    margin-top: 20px;
    margin-bottom: 20px;
  }
</style>
