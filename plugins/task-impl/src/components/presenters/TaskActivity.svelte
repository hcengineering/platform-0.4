<script lang="ts">
  import core, { Account, Doc, ObjectTx, Ref, Tx, txObjectClass, TxUpdateDoc } from '@anticrm/core'
  import type { Task } from '@anticrm/task'
  import TaskStatus from '../TaskStatus.svelte'
  import TaskPreview from './TaskPreview.svelte'
  import TaskRef from './TaskRef.svelte'
  import { MarkdownViewer, CheckBoxList, UserInfo, DateTime } from '@anticrm/ui'
  import task from '../../plugin'
  import { getClient } from '@anticrm/workbench'
  import { openReferencedDocument } from '@anticrm/presentation'

  const client = getClient()

  export let tx: Tx<Doc>
  export let doc: Doc | undefined = undefined

  let objTx: ObjectTx<Task> | undefined
  let updateDoc: TxUpdateDoc<Task> | undefined

  $: objTx = txObjectClass(tx) !== undefined ? (tx as ObjectTx<Task>) : undefined
  $: updateDoc = tx._class === core.class.TxUpdateDoc ? (tx as TxUpdateDoc<Task>) : undefined

  async function getUser (userId: Ref<Account>): Promise<Account> {
    return (await client.findAll(core.class.Account, { _id: userId }))[0]
  }
</script>

{#if tx._class === core.class.TxCreateDoc}
  {#if doc === undefined && objTx}
    <span>Created task</span>
    <TaskPreview objectId={objTx.objectId} objectClass={objTx.objectClass} />
  {:else}
    Created
  {/if}
{:else if updateDoc !== undefined}
  {#if updateDoc.operations.status !== undefined}
    {#if doc === undefined && objTx}
      <TaskRef objectId={objTx.objectId} objectClass={objTx.objectClass} />
    {/if}
    <span>Status updated</span>
    <TaskStatus value={updateDoc.operations.status} />
  {/if}

  {#if updateDoc.operations.description !== undefined}
    {#if doc === undefined && objTx}
      <TaskRef objectId={objTx.objectId} objectClass={objTx.objectClass} />
    {/if}
    <span>Description updated</span>
    <MarkdownViewer
      message={updateDoc.operations.description}
      refAction={(evt) => {
        openReferencedDocument(client, evt)
      }}
    />
  {/if}

  {#if updateDoc.operations.dueTo !== undefined}
    {#if doc === undefined && objTx}
      <TaskRef objectId={objTx.objectId} objectClass={objTx.objectClass} />
    {/if}
    <span>Due Date updated</span>
    <DateTime value={updateDoc.operations.dueTo} dateOnly />
  {/if}

  {#if updateDoc.operations.assignee !== undefined}
    {#if updateDoc.operations.assignee !== ''}
      {#if doc === undefined && objTx}
        <TaskRef objectId={objTx.objectId} objectClass={objTx.objectClass} />
      {/if}
      <span>Assigned to:</span>
      {#await getUser(updateDoc.operations.assignee) then user}
        <UserInfo {user} />
      {/await}
    {:else}
      Unassigned
    {/if}
  {/if}

  {#if updateDoc.operations.checkItems !== undefined}
    {#if doc === undefined && objTx}
      <TaskRef objectId={objTx.objectId} objectClass={objTx.objectClass} />
    {/if}
    <span>Check items updated:</span>
    <CheckBoxList label={task.string.ToDos} items={updateDoc.operations.checkItems} editable={false} />
  {/if}
{/if}

<style lang="scss">
</style>
