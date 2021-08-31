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
  import type { Message, Message as MessageModel } from '@anticrm/chunter'
  import ReferenceInput from './ReferenceInput.svelte'
  import Channel from './Channel.svelte'
  import { deepEqual } from 'fast-equals'
  import type { IntlString } from '@anticrm/status'
  import notification from '@anticrm/notification'
  import type { WithNotifications } from '@anticrm/notification'

  const client = getClient()

  let to: Ref<Account>[] = []
  let toAccount: Account[] = []
  let currentSpace: Ref<Space> | undefined

  let div: HTMLElement
  let autoscroll = true
  let messages: (MessageModel & WithNotifications)[] = []

  let allAccounts: Account[] = []

  let accountUpdater: QueryUpdater<Account> | undefined = undefined

  $: accountUpdater = client.query<Account>(accountUpdater, core.class.Account, {}, (results) => {
    allAccounts = results
  })

  $: client.findAll<Account>(core.class.Account, { _id: { $in: to } }).then((acc) => {
    toAccount = acc
    currentSpace = undefined
    messages = []

    // Check if we have already a channel between us.
    client.findAll<Space>(chunter.class.Channel, { direct: true, private: true }).then((channels) => {
      for (const c of channels) {
        const m1 = [...c.members].sort()
        const m2 = [client.accountId(), ...to].sort()
        if (deepEqual(m1, m2)) {
          // Ok, we have channel already
          currentSpace = c._id
          return
        }
      }
    })
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

      await client.createDoc(notification.class.Subscribe, channel._id, {
        objectClass: chunter.class.Message,
        objectId: channel._id,
        clients: channel.members
      })

      currentSpace = channel._id
    }

    await client.createDoc(chunter.class.Message, currentSpace, {
      message
    })
  }

  let query: QueryUpdater<Message> | undefined = undefined

  $: if (currentSpace !== undefined) {
    query = client.query<Message>(query, chunter.class.Message, { space: currentSpace }, async (result) => {
      const notifications = await client.findAll(notification.class.Notification, {
        objectId: { $in: result.map((m) => m._id) },
        client: client.accountId()
      })
      messages = result.map((m) =>
        Object.assign(m, { notifications: notifications.filter((n) => n.objectId === m._id) })
      )
      if (autoscroll) div.scrollTo(div.scrollTop, div.scrollHeight)
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
  <div
    class="msg-board"
    bind:this={div}
    on:scroll={() => {
      div.scrollTop > div.scrollHeight - div.clientHeight - 20 ? (autoscroll = true) : (autoscroll = false)
    }}
  >
    <Channel {messages} />
  </div>
  <div class="message-input">
    <ReferenceInput
      thread={false}
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
