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
  import { showPopup, Link } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import chunter from '../plugin'
  import { translate } from '@anticrm/platform'
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
</script>

{#if pinned.length > 0}
  <div class="flex-row-center pins-board">
    {#await translate(chunter.string.Pinned, {}) then text}
      <Link
        label={pinned.length + ' ' + text.toLowerCase()}
        icon={Pin}
        transparent
        maxLenght={0}
        on:click={() => showPopup(PinnedItemsView, { space }, 'right')}
      />
    {/await}
  </div>
{/if}

<style lang="scss">
  .pins-board {
    flex-shrink: 0;
    padding: 1rem 2.5rem;
    border-bottom: 1px solid var(--theme-menu-divider);
  }
</style>
