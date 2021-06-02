<script lang="ts">
  import { getContext } from 'svelte'
  import { Themes } from '@anticrm/theme'
  import Mute from './icons/Mute.svelte'

  let { current, setTheme } = getContext('theme')

  function changeTheme () {
    switch (current) {
      case Themes.LIGHT:
        current = Themes.GREY
        break;
      case Themes.GREY:
        current = Themes.DARK
        break;
      case Themes.DARK:
        current = Themes.LIGHT
        break;
    }
    setTheme(current)
  }
</script>

<div class="container" on:click={changeTheme}>
  <Mute size={16}/>
</div>

<style lang="scss">
  .container {
    display: flex;
    align-items: center;
    height: 56px;
  }
</style>