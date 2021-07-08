<script>
  export let level = 1
</script>

{#if level === 1}
  <h1>
    <slot />
  </h1>
{:else if level === 2}
  <h2>
    <slot />
  </h2>
{:else if level === 3}
  <h3>
    <slot />
  </h3>
{:else if level === 4}
  <h4>
    <slot />
  </h4>
{:else if level >= 5}
  <h5>
    <slot />
  </h5>
{/if}
