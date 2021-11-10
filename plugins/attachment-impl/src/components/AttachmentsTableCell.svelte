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
  import attachment, { Attachment } from '@anticrm/attachment'
  import { Ref } from '@anticrm/core'
  import { IconAttach, showPopup } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import AttachmentPopupList from './AttachmentPopupList.svelte'

  export let attachments: Ref<Attachment>[]
  const client = getClient()

  async function open (e: MouseEvent): Promise<void> {
    if (attachments.length > 0) {
      e.stopPropagation()
      const items = await client.findAll(attachment.class.Attachment, { _id: { $in: attachments } })
      showPopup(AttachmentPopupList, { items: items }, e.target as HTMLElement)
    }
  }
</script>

<div class="flex-row-center" on:click={open}>
  <IconAttach />
  {attachments.length}
</div>
