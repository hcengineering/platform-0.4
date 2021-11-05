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
  import type { WithMessage } from '@anticrm/chunter'
  import { getClient } from '@anticrm/workbench'
  import { newAllBookmarksQuery } from '../bookmarks'
  import Message from './Message.svelte'

  export let messages: WithMessage[] = []
  export let thread: boolean = false

  newAllBookmarksQuery(getClient(), () => {
    // Just to cache bookmarks.
  })
</script>

<div class="flex-col">
  {#each messages as m (m._id)}
    <Message message={m} {thread} showLabels={true} />
  {/each}
</div>
