<script lang="ts">
  import core, { Doc, ObjectTx, Tx, txObjectClass, TxUpdateDoc } from '@anticrm/core'
  import type { Applicant } from '@anticrm/recruiting'

  export let tx: Tx<Doc>
  export let doc: Doc | undefined = undefined

  let objTx: ObjectTx<Applicant> | undefined
  let updateDoc: TxUpdateDoc<Applicant> | undefined

  $: objTx = txObjectClass(tx) !== undefined ? (tx as ObjectTx<Applicant>) : undefined
  $: updateDoc = tx._class === core.class.TxUpdateDoc ? (tx as TxUpdateDoc<Applicant>) : undefined
</script>

<pre>
  {JSON.stringify(tx, undefined, 4)}
</pre>
{#if tx._class === core.class.TxCreateDoc}
  {#if doc === undefined && objTx}
    <span>Candidate created</span>
  {:else}
    Created
  {/if}
  <!-- {:else if updateDoc !== undefined}   -->
{/if}

<style lang="scss">
</style>
