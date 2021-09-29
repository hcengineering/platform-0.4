<!--
// Copyright © 2021 Anticrm Platform Contributors.
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
  import { createEventDispatcher } from 'svelte'
  import core from '@anticrm/core'
  import type { Account, Doc } from '@anticrm/core'
  import type { Event } from '@anticrm/calendar'
  import calendar from '@anticrm/calendar'
  import { EditBox, TextArea, DatePicker, UserInfo, SelectBox } from '@anticrm/ui'
  import type { IPopupItem } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'

  import { QueryUpdater } from '@anticrm/presentation'

  export let event: Omit<Event, keyof Doc>
  const client = getClient()
  const dispatch = createEventDispatcher()

  let accounts: Account[] = []
  let lqAccounts: QueryUpdater<Account> | undefined
  $: lqAccounts = client.query(lqAccounts, core.class.Account, {}, (result) => {
    accounts = result
  })

  let selectorItems: IPopupItem[] = []

  $: selectorItems = accounts.map((acc) => ({
    props: {
      user: acc
    },
    selected: event.participants.includes(acc._id),
    action: () => {
      if (acc._id === event.owner) {
        return
      }

      event.participants = [...event.participants, acc._id]

      onUpdate()
    },
    onDeselect: () => {
      if (acc._id === event.owner) {
        return false
      }

      event.participants = event.participants.filter((x) => x !== acc._id)

      onUpdate()
    }
  }))

  function onUpdate () {
    dispatch('update')
  }

  const onDateUpdate =
    (key: 'startsAt' | 'endsAt') =>
      ({ detail: value }: { detail: Date }) => {
        event[key] = value.getTime()
        onUpdate()
      }
</script>

<div class="root">
  <EditBox label={calendar.string.Title} bind:value={event.name} on:blur={onUpdate} />
  <TextArea label={calendar.string.Description} bind:value={event.description} on:blur={onUpdate} />
  <DatePicker
    label={calendar.string.StartTime}
    noLabel={calendar.string.NoStartTime}
    value={event.startsAt !== undefined ? new Date(event.startsAt) : undefined}
    on:change={onDateUpdate('startsAt')}
  />
  <DatePicker
    label={calendar.string.EndTime}
    noLabel={calendar.string.NoEndTime}
    value={event.endsAt !== undefined ? new Date(event.endsAt) : undefined}
    on:change={onDateUpdate('endsAt')}
  />
  <SelectBox items={selectorItems} component={UserInfo} />
</div>

<style lang="scss">
  .root {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
</style>
