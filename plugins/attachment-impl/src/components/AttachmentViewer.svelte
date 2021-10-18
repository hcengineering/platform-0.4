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
  import { ActionIcon, Label } from '@anticrm/ui'
  import Download from './icons/Download.svelte'
  import PDFViewer from './PDFViewer.svelte'

  export let item: Attachment
  let type = ''

  $: {
    switch (item.mime) {
      case 'application/pdf':
        type = 'PDF'
        break
      default:
        type = item.mime.replace(/\/.+/, '')
        break
    }
  }

  function download (item: Attachment): void {
    window.open(item.url, '_blank')
  }

  function getImageURL (url: string): string {
    return url.startsWith('blob') ? url : url + '?width=800'
  }
</script>

<div class="container">
  <div class="content">
    {#if type === 'image'}
      <div><img src={getImageURL(item.url)} alt={item.name} /></div>
      <ActionIcon
        icon={Download}
        action={() => {
          download(item)
        }}
        size={24}
      />
    {:else if type === 'audio'}
      <div><audio controls crossorigin="use-credentials" src={item.url} /></div>
      <ActionIcon
        icon={Download}
        action={() => {
          download(item)
        }}
        size={24}
      />
    {:else if type === 'video'}
      <div>
        <video controls crossorigin="use-credentials" src={item.url} preload="metadata">
          <track kind="captions" label={item.name} />
        </video>
      </div>
      <ActionIcon
        icon={Download}
        action={() => {
          download(item)
        }}
        size={24}
      />
    {:else if type === 'PDF'}
      <div><PDFViewer url={item.url} /></div>
      <ActionIcon
        icon={Download}
        action={() => {
          download(item)
        }}
        size={24}
      />
    {:else}
      <Label label={attachment.string.PreviewNotAvailable} />
      <div
        class="downloadButton"
        on:click={() => {
          download(item)
        }}
      >
        <Download size={200} />
      </div>
    {/if}
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

      div {
        margin-bottom: 20px;
      }

      .downloadButton {
        cursor: pointer;
      }

      img {
        max-width: 800px;
        max-height: 800px;
      }

      video {
        max-width: 800px;
        max-height: 800px;
      }
    }
  }
</style>
