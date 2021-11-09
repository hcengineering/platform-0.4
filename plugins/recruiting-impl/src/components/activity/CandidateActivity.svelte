<script lang="ts">
  import core, { Doc, ObjectTx, Tx, txObjectClass, TxUpdateDoc } from '@anticrm/core'
  import type { Candidate } from '@anticrm/recruiting'

  export let tx: Tx<Doc>
  export let doc: Doc | undefined = undefined

  let objTx: ObjectTx<Candidate> | undefined
  let updateDoc: TxUpdateDoc<Candidate> | undefined

  $: objTx = txObjectClass(tx) !== undefined ? (tx as ObjectTx<Candidate>) : undefined
  $: updateDoc = tx._class === core.class.TxUpdateDoc ? (tx as TxUpdateDoc<Candidate>) : undefined
</script>

<!-- <pre>
  {JSON.stringify(tx, undefined, 4)}
</pre> -->
{#if tx._class === core.class.TxCreateDoc}
  {#if doc === undefined && objTx}
    <span>Candidate created</span>
  {:else}
    Created
  {/if}
{:else if updateDoc !== undefined}
  {#if updateDoc.operations.title !== undefined}
    <span>Title updated</span>
    {updateDoc.operations.title}
  {/if}

  {#if updateDoc.operations.status !== undefined}
    <span>Status updated</span>
    {updateDoc.operations.status}
  {/if}

  {#if updateDoc.operations.salaryExpectation !== undefined}
    <span>Salary updated</span>
    {updateDoc.operations.salaryExpectation}
  {/if}

  {#if updateDoc.operations.socialLinks !== undefined}
    <span>Social links updated</span>
  {/if}

  {#if updateDoc.operations.workPreference !== undefined}
    <span>Work preferences updated</span>
  {/if}
{/if}

<style lang="scss">
</style>
