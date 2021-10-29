<script language="ts">
  export let skip = 0
  export let total = 0
  export let limit = 150
</script>

{#if total > 0}
  <div class="limits">
    Tasks of {skip + 1}-{limit} of {total}
  </div>
{/if}

<style lang="scss">
  .limits {
    margin: 10px 30px;
  }
</style>
