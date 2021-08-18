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
  import { UserBox } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import chunter from '../plugin'
  import type { Message, Message as MessageModel } from '@anticrm/chunter'
  import ReferenceInput from './ReferenceInput.svelte'
  import Channel from './Channel.svelte'
  import { deepEqual } from 'fast-equals'

  const client = getClient()

  let to: Ref<Account>[] = []
  let toAccount: Account[] = []
  let currentSpace: Ref<Space> | undefined

  let div: HTMLElement
  let autoscroll: boolean = true
  let messages: MessageModel[] = []

  $: client.findAll(core.class.Account, { _id: { $in: to } }).then((acc) => {
    toAccount = acc
    currentSpace = undefined
    messages = []

    // Check if we have already a channel between us.
    client.findAll(chunter.class.Channel, { direct: true, private: true }).then((channels) => {
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
    if (to === undefined) {
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
      currentSpace = channel._id
    }

    client.createDoc(chunter.class.Message, currentSpace, {
      message
    })
  }

  async function getMembers (): Promise<Array<Account>> {
    return await client.findAll(core.class.Account, {})
  }

  let query: QueryUpdater<Message> | undefined

  $: if (currentSpace !== undefined) {
    query = client.query(query, chunter.class.Message, { space: currentSpace }, (result) => {
      messages = result
      if (autoscroll) div.scrollTo(div.scrollTop, div.scrollHeight)
    })
  }
</script>

<div class="new-message">
  <div class="address">
    {#await getMembers() then users}
      <UserBox
        selected={[...to].shift()}
        on:change={(evt) => (to = [evt.detail])}
        {users}
        caption={chunter.string.UserTo}
        title={chunter.string.MessageTo}
        label={chunter.string.MessageToLabel}
        showSearch
      />
    {/await}
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
