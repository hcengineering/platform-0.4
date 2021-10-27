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

  export let objectId: Ref<Doc>
  export let space: Ref<Space>
  export let objectClass: Ref<Class<Doc>>
  export let editable: boolean = false
  const client = getClient()
  let items: Array<UploadAttachment> = []

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
</script>

<AttachmentList {items} createHandler={createAttachment} {editable} />
