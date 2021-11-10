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
  import type { Ref } from '@anticrm/core'
  import type { DerivedEvent, Event } from '@anticrm/calendar'
  import calendar from '@anticrm/calendar'
  import type { QueryUpdater } from '@anticrm/presentation'
  import { getClient, showSideDocument } from '@anticrm/workbench'
  import { IconClose, ScrollBox } from '@anticrm/ui'

  import EventEditor from './EventEditor.svelte'
  import EventViewer from './EventViewer.svelte'

  export let id: Ref<Event | DerivedEvent>

  const client = getClient()
  let event: Event | undefined
  let prevEvent: Event | undefined

  let lqEvent: QueryUpdater<Event> | undefined

  $: lqEvent = client.query(lqEvent, calendar.class.Event, { _id: id }, (evts) => {
    const first = evts[0]

    if (!first) {
      return
    }

    event = { ...first }
    prevEvent = { ...first }
  })

  let isDerived = false
  $: isDerived = event?._class === calendar.class.DerivedEvent

  async function onUpdate () {
    if (event === undefined || prevEvent === undefined) {
      return
    }

    const b: any = event
    const a: any = prevEvent

    const keys = Object.keys(event)
    const update = keys.reduce((res, key) => (a[key] === b[key] ? res : { ...res, [key]: b[key] }), {})

    if (Object.getOwnPropertyNames(update).length === 0) {
      return
    }

    await client.updateDoc(calendar.class.Event, a.space, a._id, update)
  }

  function onClose () {
    showSideDocument()
  }
</script>

{#if event !== undefined}
  <div class="header">
    <div class="title">
      {event.name}
    </div>
    <div class="close" on:click={onClose}>
      <IconClose size={16} />
    </div>
  </div>
  <ScrollBox autoscrollable vertical>
    {#if isDerived}
      <EventViewer {event} />
    {:else}
      <EventEditor {event} on:update={onUpdate} />
    {/if}
  </ScrollBox>
{/if}

<style lang="scss">
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 20px;
  }

  .title {
    font-weight: 500;
    font-size: 1.25rem;
    color: var(--theme-caption-color);
    user-select: none;
  }

  .close {
    margin-left: 12px;
    opacity: 0.4;
    cursor: pointer;
    &:hover {
      opacity: 1;
    }
  }
</style>
