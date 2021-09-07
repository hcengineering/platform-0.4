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
  import type { QueryUpdater } from '@anticrm/presentation'
  import { Table, Label } from '@anticrm/ui'
  import type { Ref, Space } from '@anticrm/core'
  import { getClient, showModal } from '@anticrm/workbench'
  import type { DerivedEvent, Event } from '@anticrm/calendar'
  import calendar from '@anticrm/calendar'

  import EditEvent from './EditEvent.svelte'

  export let currentSpace: Ref<Space> | undefined
  let prevSpace: Ref<Space> | undefined

  const columns = [
    {
      label: calendar.string.Title,
      properties: [{ key: 'name', property: 'label' }],
      component: Label
    },
    {
      label: calendar.string.StartTime,
      properties: [{ key: 'startsAt', property: 'label' }],
      component: Label
    },
    {
      label: calendar.string.EndTime,
      properties: [{ key: 'endsAt', property: 'label' }],
      component: Label
    }
  ]

  const client = getClient()
  let events: Event[] = []
  let dEvents: Event[] = []
  let lqEvent: QueryUpdater<Event> | undefined
  let lqDEvent: QueryUpdater<DerivedEvent> | undefined
  $: if (currentSpace !== prevSpace) {
    prevSpace = currentSpace

    if (currentSpace !== undefined) {
      lqEvent = client.query(lqEvent, calendar.class.Event, { space: currentSpace }, (result) => (events = result))
      lqDEvent = client.query(
        lqDEvent,
        calendar.class.DerivedEvent,
        { space: currentSpace },
        (result) => (dEvents = result)
      )
    }
  }

  let data: Event[] = []

  $: data = events.concat(dEvents)
  $: console.log(data)
</script>

<Table {data} {columns} showHeader on:rowClick={(event) => showModal(EditEvent, { id: event.detail.id })} />
