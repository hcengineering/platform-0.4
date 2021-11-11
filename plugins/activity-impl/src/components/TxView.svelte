<!--
// Copyright © 2020 Anticrm Platform Contributors.
// 
// Licensed under the Eclipse Public License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License. You may
// obtain a copy of the License at https://www.eclipse.org/legal/epl-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// 
// See the License for the specific language governing permissions and
// limitations under the License.
-->
<script lang="ts">
  import core, { Account, Class, Doc, Ref, Space, Timestamp, Tx, TxCreateDoc, TxUpdateDoc } from '@anticrm/core'
  import { AnyComponent } from '@anticrm/status'
  import { Component, DateTime } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import { getContext } from 'svelte'
  import { Writable } from 'svelte/store'
  import { SpaceLastViews } from '@anticrm/notification'

  export let tx: Tx<Doc>
  export let presenters: Map<Ref<Class<Doc>>, AnyComponent>
  export let doc: Doc | undefined

  const spacesLastViews = getContext('spacesLastViews') as Writable<Map<Ref<Space>, SpaceLastViews>>

  const client = getClient()

  async function getUser (userId: Ref<Account>): Promise<Account> {
    return (await client.findAll(core.class.Account, { _id: userId }))[0]
  }

  function isNew (tx: Tx<Doc>): boolean {
    const objectLastViews = $spacesLastViews.get(tx.objectId as Ref<Space>)
    if (objectLastViews !== undefined) {
      const lastRead = objectLastViews.lastRead
      return lastRead > 0 ? tx.createOn > lastRead : false
    }
    const spaceLastViews = $spacesLastViews.get(tx.objectSpace)
    if (spaceLastViews === undefined) return false
    let lastRead = spaceLastViews.lastRead
    if (spaceLastViews.objectLastReads instanceof Map) {
      const objectLastRead = spaceLastViews.objectLastReads.get(tx.objectId) ?? 0
      lastRead = objectLastRead > lastRead ? objectLastRead : lastRead
    }
    return lastRead > 0 ? tx.createOn > lastRead : false
  }

  function isToday (value: Date | Timestamp): boolean {
    const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime()
    const date = new Date(value).getTime()
    return date - today > 0
  }

  let user: Account | undefined

  const updaterUser = async (msg: Tx<Doc>) => {
    if (msg.modifiedBy === core.account.System) {
      user = {
        _id: core.account.System,
        name: 'System',
        email: 'system@hc.engineering',
        avatar: 'https://robohash.org/system'
      } as Account
      return
    }
    user = await getUser(msg.modifiedBy)
  }
  $: updaterUser(tx)

  let presenter: AnyComponent | undefined

  $: if (tx._class === core.class.TxUpdateDoc) {
    const utx = tx as TxUpdateDoc<Doc>
    presenter = presenters.get(utx.objectClass)
  } else if (tx._class === core.class.TxCreateDoc) {
    const ctx = tx as TxCreateDoc<Doc>
    presenter = presenters.get(ctx.objectClass)
  }
</script>

<div
  class="message-container"
  class:isNew={isNew(tx)}
  data-created={tx.createOn}
  data-modified={tx.modifiedOn}
  data-id={tx._id}
>
  <slot name="header" />
  <div class="container">
    {#if user}
      <div class="avatar"><img src={user?.avatar ?? ''} alt={user?.name} /></div>
    {/if}
    {#if presenter}
      <div class="message">
        <div class="header">
          <div>
            {#if user}
              {user.name}
            {/if}
            <span>
              <DateTime value={tx.modifiedOn} timeOnly={isToday(tx.modifiedOn)} />
            </span>
          </div>
        </div>
        <div class="text">
          <Component is={presenter} props={{ tx, doc }} />
        </div>
      </div>
    {:else}
      <pre>
        {JSON.stringify(tx, undefined, 4)}
      </pre>
    {/if}
  </div>
</div>

<style lang="scss">
  .message-container {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    padding-bottom: 15px;
    border-radius: 12px;
    padding: 2px;
    padding-right: 10px;

    &.isNew {
      background-color: var(--theme-bg-accent-color);
    }

    .container {
      flex-shrink: 0;
      display: flex;

      .avatar {
        min-width: 36px;
        width: 36px;
        height: 36px;
        background-color: var(--theme-bg-accent-color);
        border-radius: 50%;
        user-select: none;
        overflow: hidden;
        img {
          max-width: 100%;
          max-height: 100%;
        }
      }

      .message {
        display: flex;
        flex-direction: column;
        width: 100%;
        margin-left: 16px;

        .header {
          font-weight: 500;
          font-size: 16px;
          line-height: 150%;
          color: var(--theme-caption-color);

          display: flex;
          justify-content: space-between;

          span {
            margin-left: 8px;
            font-weight: 400;
            font-size: 14px;
            line-height: 18px;
            opacity: 0.4;
          }
        }
        .text {
          margin-top: 10px;
          margin-bottom: 10px;
          line-height: 150%;
        }
      }
    }

    &:hover {
      background-color: var(--theme-button-bg-enabled);
      border-color: var(--theme-bg-accent-color);
    }
  }
</style>
