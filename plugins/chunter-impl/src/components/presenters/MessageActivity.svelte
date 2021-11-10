<script lang="ts">
  import core, { Doc, ObjectTx, Tx, txObjectClass, TxUpdateDoc } from '@anticrm/core'
  import { Message } from '@anticrm/chunter'

  export let tx: Tx<Doc>
  export let doc: Doc | undefined = undefined

  let objTx: ObjectTx<Message> | undefined
  let updateDoc: TxUpdateDoc<Message> | undefined

  $: objTx = txObjectClass(tx) !== undefined ? (tx as ObjectTx<Message>) : undefined
  $: updateDoc = tx._class === core.class.TxUpdateDoc ? (tx as TxUpdateDoc<Message>) : undefined
</script>

{#if tx._class === core.class.TxCreateDoc}
  {#if doc === undefined && objTx}
    Write a message in channel
  {:else}
    Created
  {/if}
{:else if updateDoc !== undefined}
  <!-- {#if updateDoc.operations.status !== undefined}
  {/if}  -->
{/if}

<style lang="scss">
</style>
