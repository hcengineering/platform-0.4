<script lang="ts">
  import { onDestroy } from 'svelte'

  export let prevDiv: HTMLElement
  export let nextDiv: HTMLElement
  export let minWidth = 150
  export let devMode = false
  export let horizontal = false

  let splitterDiv: HTMLElement
  let coverPrev: HTMLElement
  let coverNext: HTMLElement

  let prevRect: DOMRect
  let nextRect: DOMRect
  let startCoord: number

  let hoverMode = false

  function onMouseMove (event: MouseEvent): void {
    if (hoverMode) {
      let dCoord: number
      if (horizontal) {
        dCoord = event.clientY - startCoord
        if (dCoord < 0) {
          if (prevRect.height - Math.abs(dCoord) >= minWidth) {
            prevDiv.style.height = `${prevRect.height - Math.abs(dCoord)}px`
            nextDiv.style.height = `${nextRect.height + Math.abs(dCoord)}px`
          }
        } else {
          if (nextRect.height - dCoord >= minWidth) {
            prevDiv.style.height = `${prevRect.height + dCoord}px`
            nextDiv.style.height = `${nextRect.height - dCoord}px`
          }
        }
      } else {
        dCoord = event.clientX - startCoord
        if (dCoord < 0) {
          if (prevRect.width - Math.abs(dCoord) >= minWidth) {
            prevDiv.style.width = `${prevRect.width - Math.abs(dCoord)}px`
            nextDiv.style.width = `${nextRect.width + Math.abs(dCoord)}px`
          }
        } else {
          if (nextRect.width - dCoord >= minWidth) {
            prevDiv.style.width = `${prevRect.width + dCoord}px`
            nextDiv.style.width = `${nextRect.width - dCoord}px`
          }
        }
      }
      setCoverSize(coverPrev, prevDiv)
      setCoverSize(coverNext, nextDiv)
    }
  }

  function onMouseUp (event: MouseEvent): void {
    if (hoverMode) {
      coverPrev.style.visibility = coverNext.style.visibility = 'hidden'
      prevDiv.style.userSelect = nextDiv.style.userSelect = 'auto'
      hoverMode = false
    }
  }

  function onMouseDown (event: MouseEvent): void {
    prevRect = prevDiv.getBoundingClientRect()
    nextRect = nextDiv.getBoundingClientRect()
    if (horizontal) startCoord = event.clientY
    else startCoord = event.clientX
    hoverMode = true

    setCoverSize(coverPrev, prevDiv)
    setCoverSize(coverNext, nextDiv)
    coverPrev.style.visibility = coverNext.style.visibility = 'visible'
    prevDiv.style.userSelect = nextDiv.style.userSelect = 'none'
  }

  function setCoverSize (elCover: HTMLElement, elSource: HTMLElement): void {
    const rect = elSource.getBoundingClientRect()
    elCover.style.top = `${rect.top}px`
    elCover.style.left = `${rect.left}px`
    elCover.style.width = `${rect.width}px`
    elCover.style.height = `${rect.height}px`
  }

  onDestroy(() => {
    prevDiv.style = ''
    nextDiv.style = ''
  })
</script>

<svelte:window on:mousemove={onMouseMove} on:mouseup={onMouseUp} />
<div bind:this={coverPrev} class="cover" class:coverDev={devMode} />
<div bind:this={coverNext} class="cover" class:coverDev={devMode} style="background-color: #ff0" />
<div
  bind:this={splitterDiv}
  class:splitter-hoverMode={hoverMode}
  class="splitter {horizontal ? 'horizontal' : 'vertical'}"
  on:mousedown={onMouseDown}
/>

<style lang="scss">
  .splitter {
    position: relative;
    background-color: var(--theme-button-bg-enabled);
    &::after {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: var(--primary-button-enabled);
      border-radius: 2px;
    }
    &:hover, &-hoverMode {
      background-color: var(--primary-button-enabled);
      &::after {
        content: '';
        animation: showDivider .5s ease-in-out forwards;
      }
    }
  }
  .horizontal {
    margin: 10px 0;
    width: 100%;
    height: 1px;
    min-height: 1px;
    cursor: row-resize;
    &:hover::after {
      min-height: 3px;
      transform: translateY(-50%);
    }
  }
  .vertical {
    margin: 0 10px;
    height: 100%;
    width: 1px;
    min-width: 1px;
    cursor: col-resize;
    &:hover::after {
      min-width: 3px;
      transform: translateX(-50%);
    }
  }

  .cover {
    visibility: hidden;
    position: fixed;
    background-color: #fff;
    opacity: 0;
    z-index: 1000;
  }
  .coverDev {
    opacity: .5;
  }

  @keyframes showDivider {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>
