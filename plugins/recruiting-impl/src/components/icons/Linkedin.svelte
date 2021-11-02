<script lang="ts">
  export let size: number = 16
  const fill: string = 'currentColor'
</script>

<svg width={size} height={size} {fill} viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
  <path d="M1.9,0.5C0.8,0.5,0,1.3,0,2.3c0,0.9,0.8,1.9,1.9,1.9s1.9-0.8,1.9-1.9C3.9,1.3,2.9,0.5,1.9,0.5z"/>
  <rect x="0.3" y="5.4" width="3.3" height="10"/>
  <path d="M12.3,5.3c-1.7,0-2.8,0.8-3.3,1.5V5.4H5.6v10h3.3c0,0,0-3.2,0-5.1c0-1.2,0.4-2.4,2-2.4c1.9,0,1.9,1.6,1.7,2.8 c0,1.6,0,3.2,0,4.8H16v-5.3C16,6.7,15.1,5.3,12.3,5.3z"/>
</svg>
