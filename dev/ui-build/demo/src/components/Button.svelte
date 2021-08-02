<script>
  import logo from './logo.svg'
  export let type = 'button'
  export let primary = false
</script>

<button {...$$restProps} {type} class:primary on:click>
  <img src={logo}/>
  <slot>Click me</slot>
</button>
