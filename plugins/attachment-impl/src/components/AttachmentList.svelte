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
  import { showPopup, Progress } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import attachment from '@anticrm/attachment'
  import type { Attachment, UploadAttachment } from '@anticrm/attachment'
  import AttachmentView from './AttachmentView.svelte'
  import AttachmentViewer from './AttachmentViewer.svelte'
  import { getPlugin } from '@anticrm/platform'

  export let items: Array<UploadAttachment> = []
  export let editable: boolean = false
  export let horizontal: boolean = false
  const client = getClient()

  function open (item: Attachment): void {
    showPopup(AttachmentViewer, { item: item })
  }

  async function clear (item: UploadAttachment): Promise<void> {
    const fileService = await getPlugin(attachment.id)
    if (item.progress < 100) {
      item.abort()
    } else {
      await fileService.remove(item._id, item.space)
      await client.removeDoc(item._class, item.space, item._id)
    }
    const index = items.findIndex((p) => p._id === item._id)
    if (index > -1) {
      items.splice(index, 1)
      items = items
    }
  }

  function isUploading (item: UploadAttachment): boolean {
    return item.progress < 100 && item.progress > 0
  }
</script>

<div class="list" class:horizontal class:vertical={!horizontal}>
  {#each items as item (item._id)}
    <div class="list-item" class:uploading={isUploading(item)}>
      <AttachmentView
        {item}
        editable={editable && item.modifiedBy === client.accountId()}
        on:click={() => {
          isUploading(item) ? clear(item) : open(item)
        }}
        on:remove={() => {
          clear(item)
        }}
      />
      {#if isUploading(item)}
        <Progress value={item.progress} />
      {/if}
    </div>
  {/each}
</div>

<style lang="scss">
  .list {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    max-width: 100%;

    &.horizontal {
      flex-direction: row;
      margin: 16px 0;
      overflow-x: auto;

      .list-item {
        padding: 0 10px 0 10px;
      }

      .list-item + .list-item {
        border-left: 1px solid var(--theme-menu-divider);
      }
    }

    &.vertical {
      flex-direction: column;

      .list-item {
        padding: 10px 0 10px 0;
      }

      .list-item + .list-item {
        border-top: 1px solid var(--theme-menu-divider);
      }
    }

    .uploading {
      opacity: 0.6;
    }
  }
</style>
