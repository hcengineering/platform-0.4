<script lang='ts'>
  /** @restProps {h1 | button} */
  export let edit = false;

  export let value: string = ''

  import Button from "./Button.svelte";

  let btn: HTMLElement
</script>

{#if edit}
  <Button {...$$restProps} />
{:else}
  <h1 bind:this={btn} {...$$restProps}><slot /></h1>
{/if}