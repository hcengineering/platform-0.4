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
  import notification from '@anticrm/notification'
  import { afterUpdate } from 'svelte'

  const client = getClient()

  let to: Ref<Account>[] = []
  let toAccount: Account[] = []
  let currentSpace: Space | undefined

  let div: HTMLElement
  let autoscroll = false
  let messages: Message[] = []
  let notifications: SpaceNotifications | undefined

  let lastPosition = 0
  let lastTime = 0
  let waitingUpdate = false

  let allAccounts: Account[] = []

  let accountUpdater: QueryUpdater<Account> | undefined = undefined

  $: accountUpdater = client.query<Account>(accountUpdater, core.class.Account, {}, (results) => {
    allAccounts = results
  })

  $: client.findAll<Account>(core.class.Account, { _id: { $in: to } }).then((acc) => {
    toAccount = acc
    currentSpace = undefined
    notifications = undefined
    messages = []

    // Check if we have already a channel between us.
    client.findAll<Space>(chunter.class.Channel, { direct: true, private: true }).then((channels) => {
      for (const c of channels) {
        const m1 = [...c.members].sort()
        const m2 = [client.accountId(), ...to].sort()
        if (deepEqual(m1, m2)) {
          // Ok, we have channel already
          currentSpace = c
          break
        }
      }
      if (currentSpace !== undefined) {
        client
          .findAll(notification.class.SpaceNotifications, { objectId: currentSpace._id })
          .then((result) => (notifications = result.shift()))
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
      currentSpace = channel
    }

    await client.createDoc(chunter.class.Message, currentSpace._id, {
      message
    })

    await updateLastRead()
  }

  async function updateLastRead (): Promise<void> {
    if (notifications === undefined) return
    await client.updateDoc<SpaceNotifications>(notifications._class, notifications.space, notifications._id, {
      lastRead: Date.now()
    })
  }

  function scroll () {
    if (autoscroll) {
      div.scrollTo(0, div.scrollHeight)
      return
    }
    if (lastPosition > 0) {
      div.scrollTo(0, lastPosition)
      return
    }
    if (notifications?.lastRead !== undefined) {
      const messages = div.getElementsByClassName('message')
      let olderNewMessage: HTMLElement | undefined
      for (let i = messages.length; i >= 0; i--) {
        const elem = messages[i] as HTMLElement
        if (elem === undefined) continue
        const modified = elem.dataset.modified
        if (modified !== undefined && parseInt(modified) > notifications.lastRead) olderNewMessage = elem
      }
      if (olderNewMessage !== undefined) {
        olderNewMessage.scrollIntoView(false)
        return
      }
    }
    div.scrollTo(0, div.scrollHeight)
  }

  afterUpdate(() => {
    scroll()
    scrollHandler()
  })

  function scrollHandler () {
    if (currentSpace === undefined) return
    lastPosition = div.scrollTop
    const messages = div.getElementsByClassName('message')
    const divBottom = div.getBoundingClientRect().bottom
    for (let i = 0; i < messages.length; i++) {
      const elem = messages[i] as HTMLElement
      if (elem.getBoundingClientRect().bottom > divBottom) break
      const modified = elem.dataset.modified
      if (modified === undefined) continue
      const messageModified = parseInt(modified)
      lastTime = messageModified > lastTime ? messageModified : lastTime
    }
    if (lastTime > (notifications?.lastRead ?? 0)) {
      if (!waitingUpdate) {
        waitingUpdate = true
        setTimeout(updateLastRead, 3000, currentSpace)
      }
    }
  }

  let query: QueryUpdater<Message> | undefined = undefined

  $: if (currentSpace !== undefined) {
    query = client.query<Message>(query, chunter.class.Message, { space: currentSpace._id }, (result) => {
      messages = result
      autoscroll = lastPosition > 0 ? lastPosition > div.scrollHeight - div.clientHeight - 30 : false
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
  <div class="msg-board" bind:this={div} on:scroll={scrollHandler}>
    {#if currentSpace}
      <Channel {notifications} {messages} />
    {/if}
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
