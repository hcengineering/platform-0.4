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
  import type { Channel } from '@anticrm/chunter'

  import { Icon } from '@anticrm/ui'
  import UserSpaceInfo from './UserSpaceInfo.svelte'

  export let space: Channel | undefined

  import chunter from '../plugin'
</script>

{#if space}
  {#if space.direct}
    <UserSpaceInfo {space} />
  {:else}
    <div class="flex">
      <div class="icon">
        <Icon icon={space.private ? chunter.icon.Lock : chunter.icon.Hashtag} size={16} />
      </div>
      <span>
        {space.name}
      </span>
    </div>
  {/if}
{/if}

<style lang="scss">
  .icon {
    width: 16px;
    min-width: 16px;
    height: 16px;
    margin: 0 16px 0 0;
    border-radius: 4px;
    opacity: 0.3;
  }
</style>
