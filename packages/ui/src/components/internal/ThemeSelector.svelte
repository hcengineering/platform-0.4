<script lang="ts">
  import { getContext } from 'svelte'
  import Mute from './icons/Mute.svelte'

  let { currentTheme, setTheme } = getContext('theme')

  const themes = ['theme-light','theme-grey','theme-dark']

  let current = themes.indexOf(currentTheme)

  function changeTheme () {
    current++
    setTheme(themes[current % themes.length])
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