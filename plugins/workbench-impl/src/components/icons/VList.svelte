<script lang="ts">
  export let size: number = 16
  const fill: string = 'var(--theme-caption-color)'
</script>

<svg width={size} height={size} viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
  <g {fill}>
    <rect width="16" height="1.7"/>
    <rect y="7.2" width="16" height="1.7"/>
    <rect y="14.3" width="16" height="1.7"/>
  </g>
</svg>
