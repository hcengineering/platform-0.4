<script lang="ts">
  export let size: number = 16
  export let filled: boolean = false
  const fill: string = 'currentColor'
</script>

<svg width={size} height={size} {fill} viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
  <path
    d="M10.8,0.6c-1-1-2.6-0.7-3.2,0.5L4.9,6.1L1.1,7.4C0.9,7.4,0.7,7.6,0.7,7.8c-0.1,0.2,0,0.5,0.2,0.6l2.9,2.9 l-3.5,3.5L0,16l1.1-0.2l3.5-3.5l2.9,2.9c0.2,0.2,0.4,0.2,0.6,0.2s0.4-0.2,0.5-0.4l1.3-3.7l5-2.7c1.2-0.6,1.4-2.2,0.5-3.2L10.8,0.6z M8.8,1.7C9,1.3,9.5,1.2,9.8,1.5l4.7,4.7c0.3,0.3,0.2,0.8-0.2,1.1L9,10.1c-0.2,0.1-0.3,0.2-0.3,0.4l-1,3L2.6,8.3l3-1 C5.7,7.2,5.9,7.1,5.9,7L8.8,1.7z"
  />
  {#if filled}
    <path
      opacity=".8"
      d="M8.8,1.7L5.9,7c0,0.1-0.2,0.2-0.3,0.3l-3,1l5.1,5.2l1-3c0-0.2,0.1-0.3,0.3-0.4l5.3-2.8c0.4-0.3,0.5-0.8,0.2-1.1 L9.8,1.5C9.5,1.2,9,1.3,8.8,1.7z"
    />
  {/if}
</svg>
