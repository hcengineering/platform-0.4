<script lang="ts">
  import { onDestroy } from 'svelte'

  let hours = ''
  let minutes = ''
  let delimiter = false

  function updateTime () {
    const date = new Date()
    const h = date.getHours()
    hours = h < 10 ? `0${h}` : h.toString()
    const m = date.getMinutes()
    minutes = m < 10 ? `0${m}` : m.toString()
    delimiter = !delimiter
  }

  const interval = setInterval(updateTime, 500)
  updateTime()

  onDestroy(() => clearInterval(interval))
</script>

<div>
  <span>{hours}</span>
  <span class:h={!delimiter}>:</span>
  <span>{minutes}</span>
</div>

<style>
  .h {
    visibility: hidden;
  }
</style>
