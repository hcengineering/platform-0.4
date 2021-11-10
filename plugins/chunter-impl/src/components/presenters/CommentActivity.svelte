<script lang="ts">
  import { Comment } from '@anticrm/chunter'
  import core, {
    Doc,
    ObjectTx,
    parseFullRef,
    PresentationMode,
    Tx,
    TxCreateDoc,
    txObjectClass,
    TxUpdateDoc
  } from '@anticrm/core'
  import { MarkdownViewer } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import { DocumentReference, ReferenceKind } from '../../messages'
  import RefControl from '../RefControl.svelte'

  export let tx: Tx<Doc>
  export let doc: Doc | undefined = undefined
  const client = getClient()

  let objTx: ObjectTx<Comment> | undefined
  let updateDoc: TxUpdateDoc<Comment> | undefined
  let createDoc: TxCreateDoc<Comment> | undefined

  $: objTx = txObjectClass(tx) !== undefined ? (tx as ObjectTx<Comment>) : undefined
  $: updateDoc = tx._class === core.class.TxUpdateDoc ? (tx as TxUpdateDoc<Comment>) : undefined
  $: createDoc = tx._class === core.class.TxCreateDoc ? (tx as TxCreateDoc<Comment>) : undefined

  const getRef = async (tx: ObjectTx<Comment>): Promise<DocumentReference> => {
    if (tx === undefined) {
      throw new Error('wrong tx')
    }
    let replyOf: string = ''
    if (tx._class === core.class.TxUpdateDoc) {
      // Nice, we have a reference to component
      replyOf = (await client.findAll(tx.objectClass, { _id: tx.objectId })).shift()?.replyOf ?? ''
    } else {
      replyOf = (tx as TxCreateDoc<Comment>).attributes.replyOf
    }
    const parsed = parseFullRef(replyOf)
    return { kind: ReferenceKind.Document, text: '', objectId: parsed._id, objectClass: parsed._class }
  }
</script>

{#if createDoc !== undefined}
  Leaf a comment
  {#if doc === undefined && objTx}
    {#await getRef(objTx) then ref}
      <RefControl reference={ref} mode={PresentationMode.Link} componentOnly={true} />
    {/await}
  {/if}

  <div class="content">
    <MarkdownViewer message={createDoc.attributes.message} />
  </div>
{:else if updateDoc !== undefined}
  Update a comment to:
  <div class="content">
    <MarkdownViewer message={updateDoc.operations.message} />
  </div>
{/if}

<style lang="scss">
  .content {
    background-color: var(--theme-bg-accent-color);
    width: 100%;
    padding-bottom: 15px;
    border-radius: 12px;
    padding: 2px;
    padding-right: 10px;
    padding-left: 16px;
  }
</style>
