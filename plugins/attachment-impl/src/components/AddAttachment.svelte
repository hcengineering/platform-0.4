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
  import { createEventDispatcher } from 'svelte'
  import { Class, Doc, generateId, Ref, Space } from '@anticrm/core'
  import ui, { Dialog, IconFile, Progress } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import attachment, { nameToFormat } from '@anticrm/attachment'
  import type { Attachment } from '@anticrm/attachment'
  import AttachmentView from './Attachment.svelte'
  import { getPlugin } from '@anticrm/platform'

  export let objectId: Ref<Doc>
  export let objectClass: Ref<Class<Doc>>
  export let space: Ref<Space>

  interface UploadAttachmet extends Attachment {
    progress: number
    abort: () => void
  }

  const dispatch = createEventDispatcher()
  const client = getClient()
  let input: HTMLElement
  let items: UploadAttachmet[] = []

  async function confirm (): Promise<void> {
    const fileService = await getPlugin(attachment.id)
    for (const item of items) {
      const url = fileService.generateLink(item._id, space, item.name, item.format)

      await client.createDoc(
        attachment.class.Attachment,
        space,
        {
          objectClass: item.objectClass,
          objectId: item.objectId,
          name: item.name,
          size: item.size,
          format: item.format,
          mime: item.mime,
          url: url
        },
        item._id
      )
    }
  }

  async function drop (e: DragEvent): Promise<void> {
    const list = e.dataTransfer?.files
    if (list === undefined || list.length === 0) return
    for (let index = 0; index < list.length; index++) {
      const file = list.item(index)
      if (file === null) continue
      createAttachment(file)
    }
  }

  async function change (e: Event): Promise<void> {
    const elem = e.target as HTMLInputElement
    const list = elem.files
    if (list === null || list.length === 0) return
    for (let index = 0; index < list.length; index++) {
      const file = list.item(index)
      if (file === null) continue
      createAttachment(file)
    }
  }

  async function createAttachment (file: File): Promise<void> {
    const fileService = await getPlugin(attachment.id)
    const key = (generateId() + '.' + nameToFormat(file.name)) as Ref<UploadAttachmet>
    const item = {
      objectClass: objectClass,
      objectId: objectId,
      name: file.name,
      size: file.size,
      format: nameToFormat(file.name),
      mime: file.type,
      url: '',
      space: space,
      modifiedBy: client.accountId(),
      modifiedOn: Date.now(),
      createOn: Date.now(),
      _class: attachment.class.Attachment,
      _id: key,
      progress: 0,
      abort: () => {}
    }
    item.abort = await fileService.upload(file, key, space, (percent) => {
      item.progress = percent
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

  async function clearAll (): Promise<void> {
    Promise.all(
      items.map(async (item) => {
        await clear(item)
      })
    )
  }

  let dragover: boolean = false
</script>

<Dialog
  label={attachment.string.AddAttachment}
  okLabel={attachment.string.AddAttachment}
  cancelLabel={ui.string.Cancel}
  okDisabled={items.some((p) => p.progress < 100)}
  cancelAction={() => {
    clearAll()
  }}
  on:close={() => {
    dispatch('close')
  }}
  okAction={confirm}
  withCancel={true}
>
  {#each items as item (item._id)}
    <div class:uploading={item.progress < 100 && item.progress > 0}>
      <AttachmentView
        editable={true}
        bind:item
        on:dblclick={() => {
          clear(item)
        }}
      />
    </div>
    {#if item.progress < 100 && item.progress > 0}
      <Progress value={item.progress} />
    {/if}
  {/each}
  <div
    class="container"
    class:dragover
    on:drop|preventDefault={drop}
    on:dragover|preventDefault
    on:dragenter={() => {
      dragover = true
    }}
    on:dragleave={() => {
      dragover = false
    }}
  >
    <input class="hidden" bind:this={input} on:change={change} type="file" multiple={true} />
    <div
      class="icon"
      on:click={() => {
        input.click()
      }}
    >
      <IconFile size={200} />
    </div>
  </div>
</Dialog>

<style lang="scss">
  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 100%;
    margin: 0 16px;

    &.dragover {
      border: 3px dashed var(--theme-bg-accent-color);
    }

    .icon {
      cursor: pointer;
    }
    .hidden {
      display: none;
    }
  }
  .uploading {
    opacity: 0.6;
  }
</style>
