<script lang='ts'>

  import { createEventDispatcher } from "svelte";

  export let type: 'button' | 'submit' | 'reset' = 'button'
  export let onClick: (name: string, somevalue: number, other?: {name: string, val: number}) => void

  const dispatch2 = createEventDispatcher()

  export function changeType(a: number, b: string): void {
    type = 'submit'
  }

  /**
  * @event {{ name: string, evt: Event }} eee
  */
</script>

<button {...$$restProps} {type} on:click={() => onClick('qwe', 1, {name: 'ttt', val: 4}) }
  on:keydown={(e) => dispatch2('eee', {name: 'zzz', evt: e})}>
  <slot>Click me</slot>
</button>

