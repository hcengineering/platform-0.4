<script lang="ts">
  import type { Status } from '@anticrm/status'
  import { Severity } from '@anticrm/status'

  import Info from './icons/Info.svelte'
  import Label from '../Label.svelte'

  export let status: Status
</script>

<div style="font-size: 11px;">
  {#if status.severity !== Severity.OK}
    <Info size={12}/>
  {/if}
  {#if status.severity !== Severity.OK}
    <Label label={status.code} params={status.params}/>
  {/if}
</div>
