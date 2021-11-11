<script context="module" lang="ts">
  export { styleString as sty } from 'svelte-window'
</script>

<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import VariableSizeList from 'svelte-window/lib/VariableSizeList.svelte'

  export let itemCount: number
  export let itemKey: ((index: number) => string) | undefined = undefined
  export let itemSize: (x: number) => number

  let list: any
  let root: HTMLElement
  let height: number = 0
  let width: number = 0

  $: if (root) {
    const rect = root.getBoundingClientRect()

    height = rect.height
    width = rect.width
  }

  const resizeObs = new ResizeObserver((entries) => {
    const target = entries[0]

    if (target === undefined) {
      return
    }

    height = target.contentRect.height
    width = target.contentRect.width
  })

  onMount(() => {
    resizeObs.observe(root)
  })

  onDestroy(() => {
    resizeObs.disconnect()
  })

  export function reset (start: number = 0) {
    list?.instance?.resetAfterIndex?.(start, true)

    // To force rerender
    itemSize = itemSize
  }

  let scrollOffset = 0
  function onScroll (data: { scrollOffset: number }) {
    scrollOffset = data.scrollOffset
  }

  function resetScroll () {
    root.children[0]?.scrollTo({ top: scrollOffset })
  }

  $: if (root) {
    resetScroll()
  }
</script>

<div bind:this={root} class="root">
  {#if itemCount > 0}
    <VariableSizeList
      style="will-change: auto;"
      bind:this={list}
      {onScroll}
      {height}
      {itemKey}
      {width}
      {itemCount}
      {itemSize}
      useIsScrolling
      overscanCount={0}
      let:items
    >
      <slot {items} />
    </VariableSizeList>
  {/if}
</div>

<style lang="scss">
  .root {
    width: 100%;
    height: 100%;
  }
</style>
