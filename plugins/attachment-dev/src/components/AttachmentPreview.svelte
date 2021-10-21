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
  import { AttachmentViewer, AttachmentView } from '@anticrm/attachment-impl'
  import { showPopup } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'

  export let href: string
  const client = getClient()

  function open (item: Attachment): void {
    showPopup(AttachmentViewer, { item: item })
  }

  async function getItem (href: string): Promise<Attachment | undefined> {
    return (await client.findAll(attachment.class.Attachment, { url: href }, { limit: 1 })).shift()
  }

  function isImage (mime: string): boolean {
    return mime.replace(/\/.+/, '') === 'image'
  }
</script>

<div class="container">
  <div class="content">
    {#await getItem(href) then item}
      {#if item}
        <div
          on:click={() => {
            open(item)
          }}
        >
          {#if isImage(item.mime)}
            <img src={item.url} alt={item.name} />
          {:else}
            <AttachmentView {item} />
          {/if}
        </div>
      {/if}
    {/await}
  </div>
</div>

<style lang="scss">
  .container {
    align-items: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: auto;
    max-height: 100vh;
    background-color: var(--theme-bg-color);
    border-radius: 20px;
    box-shadow: 0px 50px 120px rgba(0, 0, 0, 0.4);

    .content {
      margin: 50px;
      align-items: center;
      display: flex;
      flex-direction: column;
      justify-content: center;

      img {
        max-width: 400px;
        max-height: 400px;
      }
    }
  }
</style>
