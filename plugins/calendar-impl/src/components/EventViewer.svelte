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
  import core from '@anticrm/core'
  import type { Account, Doc } from '@anticrm/core'
  import type { Event } from '@anticrm/calendar'
  import calendar from '@anticrm/calendar'
  import { UserInfo, Label } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'

  import { QueryUpdater } from '@anticrm/presentation'

  export let event: Omit<Event, keyof Doc>
  const client = getClient()

  let accounts: Account[] = []
  let lqAccounts: QueryUpdater<Account> | undefined
  $: lqAccounts = client.query(lqAccounts, core.class.Account, { _id: { $in: event.participants } }, (result) => {
    accounts = event.participants
      .map((x) => result.find((r) => r._id === x))
      .filter((x): x is Account => x !== undefined)
  })
</script>

<div class="root">
  <div class="row">
    <div class="label">
      <Label label={calendar.string.Title} />
    </div>
    <div>
      {event.name}
    </div>
  </div>
  <div class="row">
    <div class="label">
      <Label label={calendar.string.Description} />
    </div>
    <div>
      {event.description}
    </div>
  </div>
  <div class="row">
    <div class="label">
      <Label label={calendar.string.StartTime} />
    </div>
    <div>
      {new Date(event.startsAt).toLocaleString()}
    </div>
  </div>
  <div class="row">
    <div class="label">
      <Label label={calendar.string.EndTime} />
    </div>
    <div>
      {new Date(event.endsAt).toLocaleString()}
    </div>
  </div>
  <div class="row">
    <div class="label">
      <Label label={calendar.string.Participants} />
    </div>
    <div class="participants">
      {#each accounts as account (account._id)}
        <UserInfo user={account} />
      {/each}
    </div>
  </div>
</div>

<style lang="scss">
  .root {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .label {
    font-weight: 500;
    flex-grow: 0;
    margin-right: 15px;

    &::after {
      content: ':';
    }
  }

  .row {
    display: flex;
    align-items: flex-start;
  }

  .participants {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
</style>
