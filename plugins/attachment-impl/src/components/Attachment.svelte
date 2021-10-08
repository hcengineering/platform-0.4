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
  import { sizeToString } from '@anticrm/attachment'
  import type { Attachment } from '@anticrm/attachment'
  import { EditBox } from '@anticrm/ui'

  export let item: Attachment
  export let editable: boolean = false
</script>

<div class="content" on:click on:dblclick>
  <div class="icon">
    <div>{item.format.toUpperCase()}</div>
  </div>
  <div class="info">
    {#if editable}
      <EditBox bind:value={item.name} />
    {:else}
      <div class="label">{item.name}</div>
    {/if}
    <div class="size">{sizeToString(item.size)}</div>
  </div>
</div>

<style lang="scss">
  .content {
    display: flex;
    flex-grow: 1;
    align-items: center;
    cursor: pointer;
    border-bottom: 1px solid var(--theme-menu-divider);
    padding-bottom: 10px;

    .icon {
      width: 32px;
      height: 32px;
      border-radius: 25%;
      background-color: #4474f6;
      display: flex;

      div {
        margin: auto;
        font-size: 10px;
        font-weight: 500;
        color: var(--theme-caption-color);
      }
    }

    .label {
      font-size: 14px;
      color: var(--theme-caption-color);
    }

    .info {
      margin-left: 20px;
    }
  }
</style>
