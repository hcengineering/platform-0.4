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
  import { createEventDispatcher } from 'svelte'

  import type { IntlString } from '@anticrm/status'

  import { AnySvelteComponent } from '../../types'
  import Panel from './Panel.svelte'
  import Card from './Card.svelte'

  interface State {
    _id: string
    name: IntlString | string
    color?: string
  }

  interface Item {
    _id: string
    state: string
  }

  export let items: Item[] = []
  export let states: State[] = []
  export let cardComponent: AnySvelteComponent

  const dispatch = createEventDispatcher()

  let itemMap = new Map<string, Item>()
  $: itemMap = new Map(items.map((x) => [x._id, x]))

  let groupedItems = new Map<string, Item[]>()
  $: groupedItems = items.reduce((grouped, x) => {
    grouped.set(x.state, [...(grouped.get(x.state) ?? []), x])

    return grouped
  }, new Map<string, Item[]>())

  $: if (groupedItems) {
    states = states
  }

  let dragId: string | undefined

  function getItems (id: string): Item[] {
    return groupedItems.get(id) ?? []
  }
</script>

{#each states as state (state._id)}
  <Panel
    title={state.name}
    counter={getItems(state._id).length}
    color={state.color}
    on:dragover={(event) => {
      event.preventDefault()
    }}
    on:drop={(event) => {
      event.preventDefault()
      const dragCard = itemMap.get(dragId ?? '')

      if (dragCard !== undefined && state._id !== dragCard.state) {
        dispatch('drop', { item: dragId, state: state._id })
      }
    }}
  >
    {#each getItems(state._id) as item (item._id)}
      <Card
        component={cardComponent}
        draggable={true}
        doc={item}
        on:dragstart={() => {
          dragId = item._id
        }}
      />
    {/each}
  </Panel>
{/each}
