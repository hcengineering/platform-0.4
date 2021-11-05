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
  import { getClient } from '@anticrm/workbench'
  import attachment from '@anticrm/attachment'
  import type { UploadAttachment } from '@anticrm/attachment'
  import { getPlugin } from '@anticrm/platform'
  import AttachmentList from './AttachmentList.svelte'
  import { Header } from '@anticrm/ui'

  export let objectId: Ref<Doc>
  export let space: Ref<Space>
  export let objectClass: Ref<Class<Doc>>
  export let editable: boolean = false

  const client = getClient()
  let items: Array<UploadAttachment> = []
  let input: HTMLElement

  let lq: QueryUpdater<UploadAttachment> | undefined
  $: lq = client.query(lq, attachment.class.Attachment, { objectId: objectId }, (result) => {
    items = result
  })

  async function createAttachment (file: File): Promise<void> {
    const fileService = await getPlugin(attachment.id)
    let item: UploadAttachment
    // eslint-disable-next-line prefer-const
    item = await fileService.createAttachment(file, objectId, objectClass, space, client, (item, progress) => {
      item.progress = progress
      items = items
    })
    items.push(item)
    items = items
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

  let dragover: boolean = false

  function click (): void {
    input.click()
  }
</script>

<div
  class:dragover
  on:drop|preventDefault={drop}
  on:dragover|preventDefault
  on:dragenter|preventDefault|stopPropagation={() => {
    console.log('set dragover to true')
    dragover = true
  }}
  on:dragleave|preventDefault|stopPropagation={() => {
    console.log('set dragover to false')
    dragover = false
  }}
>
  <Header label={attachment.string.Attachments} addHandler={editable ? click : undefined} />
  <AttachmentList {items} {editable} />
  <input class="hidden" bind:this={input} on:change={change} type="file" multiple={true} />
</div>

<style lang="scss">
  .dragover {
    border: 3px dashed var(--theme-bg-accent-color);
  }

  .hidden {
    display: none;
  }
</style>
