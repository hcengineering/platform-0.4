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
  import { Channel } from '@anticrm/chunter'

  import { Icon } from '@anticrm/ui'

  export let space: Channel | undefined
  import chunter from '../plugin'
  import UserSpaceInfo from './UserSpaceInfo.svelte'
</script>

{#if space}
  {#if space.direct}
    <UserSpaceInfo {space} headerSize />
  {:else}
    <div class="dotted-text title">
      <span>
        <Icon icon={space.private ? chunter.icon.Lock : chunter.icon.Hashtag} size={16} />
      </span>
      {space.name}
    </div>
    <div class="dotted-text subtitle">
      {space.description}
    </div>
  {/if}
{/if}

<style lang="scss">
  .title {
    display: flex;
    align-items: center;
    font-size: 16px;
    font-weight: 500;

    span {
      width: 16px;
      height: 16px;
      margin-right: 8px;
    }
  }
  .subtitle {
    font-size: 12px;
    font-weight: 400;
    opacity: 0.3;
  }
</style>
