<script context="module" lang="ts">
  export { styleString as sty } from 'svelte-window'
</script>

<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import VariableSizeList from 'svelte-window/lib/VariableSizeList.svelte'

  export let itemCount: number
  export let overscanCount: number = 0
  export let getItemSize: (x: number) => number

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

  export function reset () {
    list?.instance?.resetAfterIndex?.(0, true)

    // To force rerender
    getItemSize = getItemSize
  }
</script>

<div bind:this={root} class="root">
  {#if itemCount > 0}
    <VariableSizeList bind:this={list} {height} {width} {itemCount} itemSize={getItemSize} {overscanCount} let:items>
      <slot {items} />
    </VariableSizeList>
  {/if}
</div>

<style lang="scss">
  .root {
    width: 100%;
    height: 100%;
  }

  .root > :global(div) {
    will-change: auto;
  }
</style>
