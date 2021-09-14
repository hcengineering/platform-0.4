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
  import core, { Account, Ref, Space } from '@anticrm/core'
  import { QueryUpdater } from '@anticrm/presentation'
  import { SelectBox, UserInfo } from '@anticrm/ui'
  import type { IPopupItem } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import chunter from '../plugin'
  import type { Message } from '@anticrm/chunter'
  import ReferenceInput from './ReferenceInput.svelte'
  import Channel from './Channel.svelte'
  import { deepEqual } from 'fast-equals'
  import type { IntlString } from '@anticrm/status'
  import type { SpaceNotifications } from '@anticrm/notification'
  import notification, { NotificationClient } from '@anticrm/notification'
  import { afterUpdate } from 'svelte'

  const client = getClient()
  const notificationClient = new NotificationClient(client)

  let to: Ref<Account>[] = []
  let toAccount: Account[] = []
  let currentSpace: Space | undefined

  let div: HTMLElement
  let messages: Message[] = []
  let notifications: SpaceNotifications | undefined

  let allAccounts: Account[] = []

  let accountUpdater: QueryUpdater<Account> | undefined = undefined

  $: accountUpdater = client.query<Account>(accountUpdater, core.class.Account, { _id: { $ne: client.accountId() }}, (results) => {
    allAccounts = results
  })

  let query: QueryUpdater<Message> | undefined = undefined

  $: client.findAll<Account>(core.class.Account, { _id: { $in: to } }).then((acc) => {
    toAccount = acc
    notifications = undefined
    messages = []
    query?.unsubscribe()
  })

  // Check if we have already a channel between us.
  $: client.findAll<Space>(chunter.class.Channel, { direct: true, private: true }).then((channels) => {
    const targetAccounts = [client.accountId(), ...to].sort()
    for (const c of channels) {
      const channelAccounts = [...c.members].sort()
      if (deepEqual(channelAccounts, targetAccounts)) {
        // Ok, we have channel already
        currentSpace = c
        if (currentSpace !== undefined) {
          client
            .findAll(notification.class.SpaceNotifications, { objectId: currentSpace._id })
            .then((result) => (notifications = result.shift()))
        }
        return
      }
      currentSpace = undefined
    }
  })

  async function addMessage (message: string): Promise<void> {
    if (to.length === 0) {
      return
    }
    if (currentSpace === undefined) {
      const channel = await client.createDoc(chunter.class.Channel, core.space.Model, {
        name: toAccount.map((a) => a.name).join(', '),
        description: '',
        private: true,
        direct: true,
        members: [client.accountId(), ...to]
      })
      currentSpace = channel
    }

    await client.createDoc(chunter.class.Message, currentSpace._id, {
      message
    })

    if (notifications !== undefined) {
      notificationClient.readNow(notifications)
    }
  }

  afterUpdate(() => {
    notificationClient.initScroll(div, notifications?.lastRead ?? 0, false)
    scrollHandler()
  })

  function scrollHandler () {
    notificationClient.scrollHandler(div, notifications, notifications?.lastRead ?? 0, false)
  }

  $: if (currentSpace !== undefined) {
    query = client.query<Message>(query, chunter.class.Message, { space: currentSpace._id }, (result) => {
      messages = result
      notificationClient.setAutoscroll(div)
    })
  }

  function popupItems (items: Account[]): IPopupItem[] {
    return items.map((acc, index) => {
      return {
        _id: index,
        title: acc.name as IntlString,
        props: { user: acc },
        selected: to.indexOf(acc._id) !== -1,
        action: () => {
          to = [...to, acc._id]
        },
        onDeselect: () => {
          to = to.filter((it) => acc._id !== it)
        },
        matcher: (search) => {
          return acc.name.toLowerCase().indexOf(search) !== -1 || acc.email.toLowerCase().indexOf(search) !== -1
        }
      }
    })
  }
</script>

<div class="new-message">
  <div class="address">
    <SelectBox
      component={UserInfo}
      items={popupItems(allAccounts)}
      searchLabel={chunter.string.UserTo}
      showSearch={true}
    />
  </div>
  <div class="msg-board" bind:this={div} on:scroll={scrollHandler}>
    {#if currentSpace}
      <Channel {notifications} {messages} />
    {/if}
  </div>
  <div class="message-input">
    <ReferenceInput
      on:message={(event) => {
        addMessage(event.detail)
      }}
    />
  </div>
</div>

<style lang="scss">
  .new-message {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;

    .address {
      padding: 20px;
      flex-grow: 0;
    }

    .message-input {
      flex-grow: 0;
    }

    .msg-board {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      margin: 15px 15px 0px;
      padding: 25px 25px 0px;
      overflow: auto;
    }
  }
</style>
