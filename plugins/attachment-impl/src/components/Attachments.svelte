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
  import { Class, Doc, Ref, Space } from '@anticrm/core'
  import type { QueryUpdater } from '@anticrm/presentation'
  import { IconAdd, Label, showPopup, Progress } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import attachment from '@anticrm/attachment'
  import type { Attachment, UploadAttachmet } from '@anticrm/attachment'
  import AttachmentView from './AttachmentView.svelte'
  import AttachmentViewer from './AttachmentViewer.svelte'
  import { getPlugin } from '@anticrm/platform'

  export let objectId: Ref<Doc>
  export let space: Ref<Space>
  export let objectClass: Ref<Class<Doc>>
  export let editable: boolean = false
  let input: HTMLElement
  const client = getClient()
  let items: Array<UploadAttachmet> = []

  let lq: QueryUpdater<UploadAttachmet> | undefined
  $: lq = client.query(lq, attachment.class.Attachment, { objectId: objectId }, (result) => {
    items = result
  })

  function open (item: Attachment): void {
    showPopup(AttachmentViewer, { item: item })
  }

  async function drop (e: DragEvent): Promise<void> {
    const list = e.dataTransfer?.files
    if (list === undefined || list.length === 0) return
    for (let index = 0; index < list.length; index++) {
      const file = list.item(index)
      if (file === null) continue
      await createAttachment(file)
    }
  }

  async function change (e: Event): Promise<void> {
    const elem = e.target as HTMLInputElement
    const list = elem.files
    if (list === null || list.length === 0) return
    for (let index = 0; index < list.length; index++) {
      const file = list.item(index)
      if (file === null) continue
      await createAttachment(file)
    }
  }

  async function createAttachment (file: File): Promise<void> {
    const fileService = await getPlugin(attachment.id)
    const item = await fileService.createAttachment(file, objectId, objectClass, space, client, (progress: number) => {
      item.progress = progress
      items = items
    })
    items.push(item)
    items = items
  }

  async function clear (item: UploadAttachmet): Promise<void> {
    const fileService = await getPlugin(attachment.id)
    if (item.progress < 100) {
      item.abort()
    } else {
      await fileService.remove(item._id, item.space)
    }
    const index = items.findIndex((p) => p._id === item._id)
    if (index > -1) {
      items.splice(index, 1)
      items = items
    }
  }

  function isUploading (item: UploadAttachmet): boolean {
    return item.progress < 100 && item.progress > 0
  }

  let dragover: boolean = false
</script>

<div class="list">
  {#each items as item (item._id)}
    <div class="list-item" class:uploading={isUploading(item)}>
      <AttachmentView
        {item}
        on:click={() => {
          isUploading(item) ? clear(item) : open(item)
        }}
      />
    </div>
    {#if isUploading(item)}
      <Progress value={item.progress} />
    {/if}
  {/each}
  {#if editable}
    <div
      class="add-item"
      class:dragover
      on:drop|preventDefault={drop}
      on:dragover|preventDefault
      on:dragenter={() => {
        dragover = true
      }}
      on:dragleave={() => {
        dragover = false
      }}
      on:click={() => {
        input.click()
      }}
    >
      <input class="hidden" bind:this={input} on:change={change} type="file" multiple={true} />
      <div class="icon"><div><IconAdd /></div></div>
      <div class="label"><Label label={attachment.string.AddAttachment} /></div>
    </div>
  {/if}
</div>

<style lang="scss">
  .list {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    max-width: 100%;
    margin: 0 16px;

    .list-item + .list-item {
      margin-top: 10px;
      margin-bottom: 10px;
    }

    .uploading {
      opacity: 0.6;
    }

    .add-item {
      display: flex;
      align-items: center;
      cursor: pointer;

      &.dragover {
        border: 3px dashed var(--theme-bg-accent-color);
      }

      .hidden {
        display: none;
      }

      .icon {
        opacity: 0.6;
        width: 32px;
        height: 32px;
        border-radius: 25%;
        background-color: var(--theme-button-bg-enabled);
        border-color: var(--theme-button-border);
        display: flex;

        div {
          margin: auto;
        }
      }
      .label {
        margin-left: 16px;
        color: var(--theme-content-color);
      }

      &:hover {
        .icon {
          opacity: 1;
        }
        .label {
          color: var(--theme-caption-color);
        }
      }
    }
  }
</style>
