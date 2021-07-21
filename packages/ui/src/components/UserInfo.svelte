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
  import type { Account } from '@anticrm/core'

  export let user: Account | undefined
  export let suptitle: string | undefined
  export let size: 24 | 32 | 36 = 24
  export let avatarOnly: boolean = false
</script>

<div class="user-container">
  {#if user}
    <div style="width: {size}px; height: {size}px;">
      <img class="img" style="width: {size}px; height: {size}px;" src={user.avatar} alt={'avatar'} />
    </div>
    {#if !avatarOnly}
      <div class="caption">
        {#if suptitle}<div class="suptitle">{suptitle}</div>{/if}
        <div class="title">{user.name}</div>
      </div>
    {/if}
  {/if}
</div>

<style lang="scss">
  .user-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    flex-wrap: nowrap;

    .img {
      border-radius: 50%;
      overflow: hidden;
    }

    .caption {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      margin-left: 8px;
      color: var(--theme-caption-color);

      .suptitle {
        opacity: 0.4;
      }
      .title {
        max-width: 150px;
        font-weight: 500;
        text-align: left;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
    }
  }
</style>
