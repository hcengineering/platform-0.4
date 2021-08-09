<script lang='ts'>
  export let value: string
</script>

<div class='bg-noise'>
  <input bind:value={value}/>
</div>
<style lang="scss">
    .bg-noise {    
    background: url('../../img/noise.png');
    z-index: -1;
  }
</style>