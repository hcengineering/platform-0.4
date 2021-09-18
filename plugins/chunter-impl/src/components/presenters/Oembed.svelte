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
  import { ActionIcon, IconMoreV } from '@anticrm/ui'
  import Send from '../icons/Send.svelte'

  export let href: URL
  export let oembedHost = ''

  let videoMeta: any = undefined
  let title: string = ''
  let author: string = ''
  let thumbnail: string | undefined
  let html: string = ''
  let embedded = false

  const newWidth = 400
  let newHeight = 0

  function getMetaInfo (href: URL): void {
    const xmlHttp = new XMLHttpRequest()
    xmlHttp.onreadystatechange = function () {
      if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
        videoMeta = JSON.parse(xmlHttp.responseText)
        newHeight = (videoMeta.height / videoMeta.width) * newWidth
        author = videoMeta.author_name
        title = videoMeta.title
        thumbnail = videoMeta.thumbnail_url
        html = videoMeta.html
      }
    }
    const youtubeMetaUri = `${oembedHost}?url=${href}&format=json&maxwidth=400&maxheight=400`
    xmlHttp.open('GET', youtubeMetaUri, true)
    xmlHttp.send(null)
  }

  $: getMetaInfo(href)
</script>

<div class="header">
  <div>
    <a href={href.toString()}>{href}</a>
    <br />
    <span>{title}</span>
  </div>
  <ActionIcon size={24} icon={IconMoreV} direction={'left'} />
</div>

{#if thumbnail}
  <div class="author">
    Author: {author}
  </div>

  <div class="emb-video">
    {#if embedded}
      <div style="width: ${newWidth}px; height: {newHeight}px;">
        {@html html}
      </div>
    {:else}
      <div>
        <img width="400px" src={thumbnail} alt={title} />
      </div>
      <div
        class="play-btn"
        on:click={() => {
          embedded = true
        }}
      >
        <Send size={128} fill="var(--theme-caption-color)" />
      </div>
    {/if}
  </div>
{/if}

<style lang="scss">
  .header {
    flex-shrink: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 16px 0 24px;
    height: 84px;
    span {
      margin-right: 16px;
      font-weight: 500;
      color: var(--theme-content-accent-color);
    }
  }
  .emb-video {
    display: flex;
    align-items: center;
    .play-btn {
      position: relative;
      box-shadow: 5px 5px 5px black;
      cursor: pointer;
      left: -264px;
      background: var(--primary-button-enabled);
      border-radius: 25%;
      &:hover {
        background: var(--primary-button-hovered);
      }
    }
  }
</style>
