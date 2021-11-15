<script lang="ts">
  export let color: string
</script>

<div class="root" style="background-color: {color};" />

<style lang="scss">
  .root {
    width: 150px;
    height: 15px;

    border-radius: 20px;
  }
</style>
