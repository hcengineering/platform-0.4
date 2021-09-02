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
  import { Readable } from 'svelte/store'
  import { getContext } from 'svelte'

  import type { Doc, Ref, Space } from '@anticrm/core'
  import { getPlugin } from '@anticrm/platform'
  import { getClient, showModal } from '@anticrm/workbench'
  import type { QueryUpdater } from '@anticrm/presentation'
  import actionPlugin from '@anticrm/action-plugin'
  import type { Action, ActionInstance } from '@anticrm/action-plugin'
  import { Button } from '@anticrm/ui'
  import type { Event } from '@anticrm/calendar'
  import calendar from '@anticrm/calendar'
  import type { Applicant } from '@anticrm/recruiting'
  import recruiting from '@anticrm/recruiting'

  import Calendar from '../icons/Calendar.svelte'

  export let action: Action
  export let instance: ActionInstance | undefined
  export let target: Applicant
  const client = getClient()

  const space = getContext('space') as Readable<Space>

  let event: Event | undefined
  let eventQ: QueryUpdater<Event> | undefined
  $: if (instance && instance.input) {
    eventQ = client.query(
      eventQ,
      calendar.class.Event,
      {
        _id: instance.input as Ref<Event>
      },
      ([first]) => {
        event = first
      }
    )
  }

  async function onEventCreate (event: Event) {
    const actionP = await getPlugin(actionPlugin.id)

    await actionP.runAction(action, `${target._id}_${target.state}`, event._id)
  }

  async function run () {
    if (instance !== undefined) {
      return
    }

    showModal(calendar.component.CreateEvent, { space: $space, onCreate: onEventCreate })
  }

  function onClick () {
    if (event === undefined) {
      return
    }

    showModal(calendar.component.EditEvent, { id: event._id })
  }
</script>

<div class="root">
  <div class="header">
    <Calendar />
    {#if instance === undefined}
      <Button label={recruiting.string.ScheduleInterview} on:click={run} />
    {:else if event !== undefined}
      <div class="title" on:click={onClick}>
        {event.name}
      </div>
    {/if}
  </div>
  {#if event !== undefined}
    <div class="details">
      <div>
        {new Date(event.startsAt).toDateString()}
      </div>
      <div>
        State: {instance?.state}
      </div>
    </div>
  {/if}
</div>

<style lang="scss">
  .root {
    display: flex;
    flex-direction: column;

    gap: 10px;
  }

  .header {
    display: flex;
    align-items: center;

    gap: 10px;
  }

  .title {
    font-weight: 500;
    cursor: pointer;
  }

  .details {
    display: flex;
    flex-direction: column;
    font-weight: 500;
    opacity: 0.4;
    text-shadow: 0px 0px 8px rgba(255, 255, 255, 0.25);
  }
</style>