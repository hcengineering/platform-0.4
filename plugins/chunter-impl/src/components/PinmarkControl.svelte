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
  import type { MessageBookmark } from '@anticrm/chunter'
  import type { Ref, Space } from '@anticrm/core'
  import { showPopup } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import { newAllBookmarksQuery } from '../bookmarks'
  import Pin from './icons/Pin.svelte'
  import PinnedItemsView from './PinnedItemsView.svelte'

  export let space: Ref<Space> | undefined

  const client = getClient()
  let pinned: MessageBookmark[] = []
  let bookmarks: MessageBookmark[] = []

  newAllBookmarksQuery(client, (result) => {
    bookmarks = result
  })

  $: pinned = bookmarks.filter((p) => p.channelPin === true && p.space === space)
  let pinsBoard: HTMLElement
</script>

{#if pinned.length > 0}
  <div bind:this={pinsBoard} class="pins-board">
    <div class="link-text pins" on:click={() => showPopup(PinnedItemsView, { space }, pinsBoard)}>
      <div class="pin">
        <Pin size={12} />
      </div>
      {pinned.length} pinned
    </div>
  </div>
{/if}

<style lang="scss">
  .pins-board {
    .pins {
      display: flex;
      align-items: center;
      font-size: 12px;
      height: 48px;
      font-weight: 400;
      border-bottom: 1px solid var(--theme-menu-divider);

      margin-left: 10px;

      .pin {
        opacity: 0.6;
      }
    }
  }
</style>
