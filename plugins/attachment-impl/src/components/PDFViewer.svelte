<!--
// Copyright © 2021 Anticrm Platform Contributors.
// 
// Licensed under the Eclipse Public License, Version 2.0 (the "License")
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
  import * as pdfjs from 'pdfjs-dist'
  import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'

  export let url: string
  let lastUrl: string | undefined
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    const WORKER_URL = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`
    pdfjs.GlobalWorkerOptions.workerSrc = WORKER_URL
  }
  let pdfDoc: PDFDocumentProxy | undefined
  const canvases: HTMLCanvasElement[] = []
  const previews: HTMLCanvasElement[] = []
  let pagesCount = 0

  $: if (lastUrl !== url) {
    lastUrl = url
    pdfjs.getDocument({ url, withCredentials: true }).promise.then((res) => {
      pdfDoc = res
      pagesCount = res.numPages
      renderAllPreviews()
      renderAllPages()
    })
  }

  function renderAllPages () {
    for (let page = 1; page <= pagesCount; page++) {
      renderPage(page, false)
    }
  }

  function renderAllPreviews () {
    for (let page = 1; page <= pagesCount; page++) {
      renderPage(page, true)
    }
  }

  function renderPage (num: number, preview: boolean) {
    pdfDoc?.getPage(num).then(function (page: PDFPageProxy) {
      const scale = preview ? 0.2 : 1
      const viewport = page.getViewport({ scale: scale })
      const canvas = preview ? previews[num - 1] : canvases[num - 1]
      canvas.height = viewport.height
      canvas.width = viewport.width
      const ctx = canvas.getContext('2d')
      const renderContext = {
        canvasContext: ctx!,
        viewport: viewport
      }
      page.render(renderContext)
    })
  }

  function selectPage (index: number) {
    canvases[index].scrollIntoView()
  }
</script>

<div class="content">
  <div class="preview scrollBox">
    {#each { length: pagesCount } as _, i}
      <div
        class="previewItem"
        on:click={() => {
          selectPage(i)
        }}
      >
        <div><canvas bind:this={previews[i]} /></div>
        <div class="page">{i + 1}</div>
      </div>
    {/each}
  </div>
  <div class="scrollBox">
    {#each { length: pagesCount } as _, i}
      <canvas bind:this={canvases[i]} />
    {/each}
  </div>
</div>

<style lang="scss">
  .content {
    display: flex;
    max-width: 900px;
    max-height: 85vh;

    .preview {
      margin-right: 20px;

      .previewItem {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;

        .page {
          margin: 10px;
        }
      }
    }

    .scrollBox {
      position: relative;
      width: auto;
      max-height: 85vh;
      overflow-y: auto;
      overflow-x: hidden;

      canvas + canvas {
        margin-top: 10px;
      }
    }
  }
</style>
