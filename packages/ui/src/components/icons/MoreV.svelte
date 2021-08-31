<script lang="ts">
  export let size: number = 24
  const fill: string = 'var(--theme-caption-color)'
</script>

<svg width={size} height={size} {fill} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path d="M11.8,10.2C10.8,10.2,10,11,10,12c0,1,0.8,1.8,1.7,1.8s1.7-0.8,1.7-1.8C13.5,11,12.7,10.2,11.8,10.2z" />
  <path d="M11.8,7.6c0.9,0,1.7-0.8,1.7-1.8c0-1-0.8-1.8-1.7-1.8S10,4.8,10,5.8C10,6.8,10.8,7.6,11.8,7.6z" />
  <ellipse cx="11.8" cy="18.2" rx="1.7" ry="1.8" />
</svg>
