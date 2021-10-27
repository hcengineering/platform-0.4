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
  import { ActionIcon, IconClose } from '@anticrm/ui'
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher()
  export let item: Attachment
  export let editable = false
</script>

<div class="content" on:click>
  <div class="icon">
    <div>{item.format.toUpperCase()}</div>
  </div>
  <div class="info">
    <div class="label">{item.name}</div>
    <div class="size">{sizeToString(item.size)}</div>
  </div>
  {#if editable}
    <div class="remove">
      <ActionIcon
        action={() => {
          dispatch('remove')
        }}
        icon={IconClose}
        size={16}
      />
    </div>
  {/if}
</div>

<style lang="scss">
  .content {
    display: flex;
    flex-grow: 1;
    align-items: center;
    cursor: pointer;

    .icon {
      width: 32px;
      height: 32px;
      border-radius: 25%;
      background-color: #4474f6;
      display: flex;
      flex-shrink: 0;

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

    &:hover .remove {
      visibility: visible;
    }

    .remove {
      background-color: var(--theme-bg-accent-color);
      border-radius: 50%;
      align-self: flex-start;
      margin-left: auto;
      visibility: hidden;
    }
  }
</style>
