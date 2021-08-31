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
  import type { Doc, Space } from '@anticrm/core'
  import type { Event } from '@anticrm/calendar'
  import calendar from '@anticrm/calendar'
  import { Dialog } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'

  import EventEditor from './EventEditor.svelte'

  const dispatch = createEventDispatcher()

  export let space: Space
  const client = getClient()

  const owner = client.accountId()
  let event: Omit<Event, keyof Doc> = {
    name: '',
    description: '',
    startsAt: new Date().getTime(),
    endsAt: new Date().getTime(),
    owner,
    participants: [owner],
    version: 0
  }

  async function create () {
    await client.createDoc(calendar.class.Event, space._id, event)
  }
</script>

<Dialog
  label={calendar.string.AddEvent}
  okLabel={calendar.string.AddEvent}
  okAction={create}
  on:close={() => dispatch('close')}
>
  <EventEditor bind:event />
</Dialog>
