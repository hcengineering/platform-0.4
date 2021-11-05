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
  import attachment, { UploadAttachment } from '@anticrm/attachment'
  import ui, { Button } from '@anticrm/ui'
  import { Class, Doc, Ref, Space } from '@anticrm/core'
  import { getPlugin } from '@anticrm/platform'
  import { getClient } from '@anticrm/workbench'
  import { createEventDispatcher } from 'svelte'

  export let file: File
  export let objectId: Ref<Doc>
  export let objectClass: Ref<Class<Doc>>
  export let space: Ref<Space>

  let canvas: HTMLCanvasElement
  let resultCanvas: HTMLCanvasElement
  let image: HTMLImageElement
  let src: string | undefined
  const dispatch = createEventDispatcher()
  const client = getClient()

  async function createImage (file: File) {
    src = URL.createObjectURL(file)
  }

  $: file && createImage(file)

  async function createAttachment (file: File): Promise<void> {
    const id = (objectId + 'avatar') as Ref<Doc>
    const fileService = await getPlugin(attachment.id)
    if (src !== undefined) {
      URL.revokeObjectURL(src)
      src = undefined
    }
    await removeAttachment(id)
    let item: UploadAttachment

    // eslint-disable-next-line
    item = await fileService.createAttachment(file, id, objectClass, space, client, (item, progress) => {
      if (progress === 100) {
        dispatch('close', item)
      }
    })
  }

  async function removeAttachment (objectId: Ref<Doc>): Promise<void> {
    const attachmentId = (
      await client.findAll(
        attachment.class.Attachment,
        { objectId: objectId, objectClass: objectClass, space: space },
        { limit: 1 }
      )
    ).shift()
    if (attachmentId === undefined) return
    const fileService = await getPlugin(attachment.id)
    await fileService.remove(attachmentId._id, attachmentId.space)
  }

  const selection = {
    x: 0,
    y: 0,
    radius: 0
  }

  function init () {
    canvas.width = image.width
    canvas.height = image.height

    selection.x = canvas.width / 2
    selection.y = canvas.height / 2
    selection.radius = Math.min(canvas.width, canvas.height) / 4
    drawSelection()
  }

  let pressed: boolean = false
  let resize: boolean = false

  const lastPos = {
    x: 0,
    y: 0
  }

  function drawSelection () {
    const ctx = canvas.getContext('2d')
    if (ctx === null) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.beginPath()

    ctx.moveTo(0, 0)
    ctx.lineTo(0, canvas.height)
    ctx.lineTo(canvas.width, canvas.height)
    ctx.lineTo(canvas.width, 0)
    ctx.lineTo(0, 0)
    ctx.moveTo(selection.x, selection.y)

    ctx.arc(selection.x, selection.y, selection.radius, 0, Math.PI * 2, false)

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fill()
  }

  function mouseMove (e: MouseEvent): void {
    if (pressed) {
      const newX = e.offsetX
      const newY = e.offsetY
      if (!resize) {
        if (!checkBorder(newX, newY, selection.radius)) return
        selection.x = newX
        selection.y = newY
      } else {
        const diff = getRange(newX, lastPos.x, newY, lastPos.y)
        const oldRange = getRange(lastPos.x, selection.x, lastPos.y, selection.y)
        const newRand = getRange(newX, selection.x, newY, selection.y)
        const sign = newRand - oldRange > 0 ? 1 : -1
        const newRadius = selection.radius + sign * diff
        lastPos.x = newX
        lastPos.y = newY
        if (!checkBorder(selection.x, selection.y, newRadius)) return
        selection.radius = newRadius
      }

      drawSelection()
    }
  }

  function getRange (x1: number, x2: number, y1: number, y2: number): number {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
  }

  function mouseDown (e: MouseEvent): void {
    lastPos.x = e.offsetX
    lastPos.y = e.offsetY
    resize = !isInner(lastPos.x, lastPos.y)
    pressed = true
  }

  function isInner (x: number, y: number): boolean {
    return getRange(x, selection.x, y, selection.y) <= selection.radius
  }

  function checkBorder (x: number, y: number, radius: number): boolean {
    if (x < 0 || y < 0 || radius < 0) return false
    if (x + radius > canvas.width) return false
    if (x - radius < 0) return false
    if (y + radius > canvas.height) return false
    if (y - radius < 0) return false
    return true
  }

  function save () {
    if (src === undefined) return
    const scale = image.height / image.naturalHeight
    const size = selection.radius * 2
    const context = resultCanvas.getContext('2d')
    resultCanvas.width = size
    resultCanvas.height = size
    if (context === null) return

    context.drawImage(
      image,
      (selection.x - selection.radius) / scale,
      (selection.y - selection.radius) / scale,
      size / scale,
      size / scale,
      0,
      0,
      size,
      size
    )

    resultCanvas.toBlob(
      (blob) => {
        if (blob !== null) {
          const res = Object.assign(blob, {
            lastModified: file.lastModified,
            webkitRelativePath: file.webkitRelativePath,
            name: file?.name
          })
          createAttachment(res)
        }
      },
      file.type,
      1
    )
  }
</script>

<div
  class="container"
  on:mousedown={mouseDown}
  on:mouseup={() => {
    pressed = false
  }}
  on:mousemove={mouseMove}
  class:resize={pressed && resize}
  class:move={pressed && !resize}
>
  <div class="content">
    <img bind:this={image} on:load={init} on:resize={init} {src} alt="Avatar" />
    <canvas bind:this={canvas} />
    <canvas class="hidden" bind:this={resultCanvas} />
  </div>
  <div class="footer">
    <Button disabled={!src} label={ui.string.Ok} size={'small'} transparent primary on:click={save} />
    <Button
      label={ui.string.Cancel}
      size={'small'}
      transparent
      on:click={() => {
        dispatch('close')
      }}
    />
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
      margin: 20px;
      align-items: center;
      display: flex;
      flex-direction: column;
      justify-content: center;

      img {
        max-width: 800px;
        max-height: 80vh;
      }

      canvas {
        top: 20;
        left: 20;
        position: absolute;
      }

      .hidden {
        display: none;
      }
    }

    &.move {
      cursor: move;
    }

    &.resize {
      cursor: nwse-resize;
    }

    .footer {
      flex-shrink: 0;
      display: grid;
      grid-auto-flow: column;
      direction: rtl;
      justify-content: start;
      align-items: center;
      column-gap: 12px;
      padding: 16px 28px 28px;
      height: 84px;
      mask-image: linear-gradient(90deg, rgba(0, 0, 0, 0) 20px, rgba(0, 0, 0, 1) 40px);
      overflow: hidden;
      border-radius: 0 0 20px 20px;
    }
  }
</style>
