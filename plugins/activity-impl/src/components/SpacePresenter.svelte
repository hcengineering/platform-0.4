<script lang="ts">
  import type { Account, Doc, Ref, Space, Tx, TxUpdateDoc } from '@anticrm/core'
  import core from '@anticrm/core'
  import { UserInfo } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'

  export let tx: Tx<Doc>
  // export let doc: Doc | undefined = undefined

  let updateDoc: TxUpdateDoc<Space> | undefined

  let pushAccounts: Account[] = []
  let pushAccountsRefs: Ref<Account>[] = []

  let pullAccounts: Account[] = []
  let pullAccountsRefs: Ref<Account>[] = []

  const client = getClient()

  $: updateDoc = tx._class === core.class.TxUpdateDoc ? (tx as TxUpdateDoc<Space>) : undefined

  function getAccounts (accounts?: any): Ref<Account>[] {
    if (Array.isArray(accounts)) {
      return accounts as Ref<Account>[]
    }
    return [accounts as Ref<Account>]
  }

  $: pushAccountsRefs = getAccounts(updateDoc?.operations?.$push?.members)

  $: if (pushAccountsRefs.length > 0) {
    client.findAll(core.class.Account, { _id: { $in: pushAccountsRefs } }).then((acc) => {
      pushAccounts = acc
    })
  } else {
    pushAccounts = []
  }

  $: pullAccountsRefs = getAccounts(updateDoc?.operations?.$pull?.members)

  $: if (pullAccountsRefs.length > 0) {
    client.findAll(core.class.Account, { _id: { $in: pullAccountsRefs } }).then((acc) => {
      pullAccounts = acc
    })
  } else {
    pullAccounts = []
  }
</script>

{#if tx._class === core.class.TxCreateDoc}
  Space Created
{:else if updateDoc !== undefined}
  {#if updateDoc.operations.private !== undefined && updateDoc.operations.private === false}
    Make space public
  {:else if updateDoc.operations.private !== undefined && updateDoc.operations.private === true}
    Make space private
  {/if}

  {#if pushAccounts.length > 0}
    {#each pushAccounts as user}
      {#if tx.modifiedBy === user._id}
        Joined.
      {:else}
        <div class="flex">
          <UserInfo {user} size={24} /> was invited.
        </div>
      {/if}
    {/each}
  {/if}

  {#if pullAccounts.length > 0}
    {#each pullAccounts as user}
      {#if tx.modifiedBy === user._id}
        Leave.
      {:else}
        <div class="flex">
          <UserInfo {user} size={24} /> was removed.
        </div>
      {/if}
    {/each}
  {/if}
{/if}

<style lang="scss">
</style>
