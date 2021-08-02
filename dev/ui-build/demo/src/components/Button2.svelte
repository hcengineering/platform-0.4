<script lang='ts'>
  export let type: 'button' | 'submit' | 'reset' = 'button'
  export let primary = false
</script>

<button {...$$restProps} {type} class:primary on:click>
  <slot>Click me</slot>
</button>
