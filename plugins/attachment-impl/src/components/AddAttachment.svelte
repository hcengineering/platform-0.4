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
  import { Class, Doc, generateId, Ref, RemoveFile, Space, UploadFile } from '@anticrm/core'
  import ui, { Dialog, EditBox, IconFile, Progress } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import attachment, { Attachment, nameToFormat } from '@anticrm/attachment'
  import AttachmentView from './Attachment.svelte'

  export let objectId: Ref<Doc>
  export let objectClass: Ref<Class<Doc>>
  export let space: Ref<Space>

  const dispatch = createEventDispatcher()
  const client = getClient()
  let name: string = ''
  let input: HTMLElement
  let file: File | undefined
  let item: Attachment | undefined
  let progress: number = 0

  async function confirm (): Promise<void> {
    if (item === undefined) return

    await client.createDoc(
      attachment.class.Attachment,
      space,
      {
        objectClass: item.objectClass,
        objectId: item.objectId,
        name: name,
        size: item.size,
        format: item.format
      },
      item._id
    )
  }

  async function uploadProgress (
    url: string,
    file: File,
    progressCallback: (percent: number) => void
  ): Promise<XMLHttpRequest> {
    return new Promise(function (resolve, reject) {
      const xhr = new XMLHttpRequest()

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            resolve(xhr)
          } else {
            reject(xhr)
          }
        }
      }

      if (progressCallback) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / file.size) * 100
            progressCallback(percentComplete)
          }
        }
      }

      xhr.open('PUT', url)
      xhr.send(file)
    })
  }

  async function drop (e: DragEvent): Promise<void> {
    file = e.dataTransfer?.files?.item(0) ?? undefined
    await createAttachment()
  }

  async function change (e: Event): Promise<void> {
    const elem = e.target as HTMLInputElement
    file = elem.files?.item(0) ?? undefined
    await createAttachment()
  }

  async function createAttachment (): Promise<void> {
    name = file?.name ?? ''
    if (file === undefined) {
      if (item !== undefined) {
        const params: RemoveFile = {
          type: 'Remove',
          key: item._id
        }

        await client.file(params)
      }
      item = undefined
    } else {
      const id = generateId()
      const params: UploadFile = {
        type: 'Upload',
        key: id,
        fileType: file.type
      }

      const url = await client.file(params)

      await uploadProgress(url, file, (percent) => {
        progress = percent
      })
      progress = 0

      item = {
        objectClass: objectClass,
        objectId: objectId,
        name: file.name,
        size: file.size,
        format: nameToFormat(file.name),
        space: space,
        modifiedBy: client.accountId(),
        modifiedOn: Date.now(),
        createOn: Date.now(),
        _class: attachment.class.Attachment,
        _id: id as Ref<Attachment>
      }
    }
  }

  async function clear (): Promise<void> {
    file = undefined
    await createAttachment()
  }

  let dragover: boolean = false
</script>

<Dialog
  label={attachment.string.AddAttachment}
  okLabel={attachment.string.AddAttachment}
  cancelLabel={ui.string.Cancel}
  on:close={() => {
    dispatch('close')
  }}
  okAction={confirm}
  withCancel={true}
>
  {#if item !== undefined}
    <AttachmentView {item} on:click={clear} />
  {:else if progress > 0}
    <Progress value={progress} />
  {:else}
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
      <input class="hidden" bind:this={input} on:change={change} type="file" />
      <div
        class="icon"
        on:click={() => {
          input.click()
        }}
      >
        <IconFile size={200} />
      </div>
    </div>
  {/if}
  <div class="name"><EditBox label={ui.string.Name} bind:value={name} /></div>
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

  .name {
    margin-top: 20px;
  }
</style>
