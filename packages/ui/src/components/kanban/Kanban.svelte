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
  import { createEventDispatcher, setContext } from 'svelte'

  import { generateId } from '@anticrm/core'
  import type { IntlString, UIComponent } from '@anticrm/status'

  import { draggable } from './draggable'
  import type { DragStartEvent, DragEndEvent } from './draggable'
  import { scrollable } from './scrollable'

  import Panel from './Panel.svelte'
  import Card from './Card.svelte'
  import DragWatcher from './drag.watcher'
  import type { DragOverEndEvent, DragOverEvent } from './hoverable'
  import { hoverable } from './hoverable'
  import type { State as HoverState } from './utils'
  import { ObjectType } from './object.types'

  interface State {
    _id: string
    name: IntlString | string
    color?: string
  }

  interface Item {
    _id: string
    state: string
  }

  export let items: Map<string, Item[]>
  export let states: State[] = []
  export let transitions: Map<string, Set<string>> | undefined = undefined
  export let cardComponent: UIComponent

  // Temporary flag, need to remove as soon as tasks plugin be updated
  export let panelDragDisabled = false

  const dragWatcher = new DragWatcher()
  setContext('dragWatcher', dragWatcher)

  const dispatch = createEventDispatcher()

  let actualItems: Item[][] = []
  $: actualItems = states.map((state) => items.get(state._id) ?? [])

  let cardDragData:
    | {
        id: string
        item: Item
        size: DragStartEvent['size']
        over: {
          card?: string
          state?: HoverState
          panel?: string
        }
      }
    | undefined
  let panelDragData:
    | {
        id: string
        size: DragStartEvent['size']
        over: {
          panel?: string
          state?: HoverState
        }
      }
    | undefined

  let cardShiftIdx = Infinity
  $: if (cardDragData?.over?.card !== undefined) {
    const targetItems = items.get(cardDragData.over.panel ?? '') ?? []
    const cardIdx = targetItems.findIndex((x) => x._id === cardDragData?.over.card)

    if (cardIdx === -1) {
      cardShiftIdx = Infinity
    } else {
      cardShiftIdx = cardIdx + (cardDragData?.over.state?.bottom ? 1 : 0)
    }
  } else {
    cardShiftIdx = Infinity
  }

  let panelShiftIdx = Infinity
  $: if (panelDragData?.over?.panel !== undefined) {
    const panelIdx = states.findIndex((x) => x._id === panelDragData?.over.panel)

    if (panelIdx === -1) {
      panelShiftIdx = Infinity
    } else {
      panelShiftIdx = panelIdx + (panelDragData?.over.state?.right ? 1 : 0)
    }
  } else {
    panelShiftIdx = Infinity
  }

  function onCardDragStart (e: CustomEvent<DragStartEvent>) {
    const item = items.get(e.detail.ctx?.state)?.find((x) => x._id === e.detail.id)

    if (item === undefined) {
      return
    }

    cardDragData = {
      ...(cardDragData ?? {}),
      id: e.detail.id,
      item,
      size: e.detail.size,
      over: {}
    }
  }

  function onCardDragEnd (e: CustomEvent<DragEndEvent>) {
    const panel = e.detail.hoveredItems.find((x) => x.type === ObjectType.Panel)
    const item = e.detail.hoveredItems.find((x) => x.type === ObjectType.Card)
    const targetState = panel?.id
    const origState = cardDragData?.item.state

    if (targetState === undefined || origState === undefined) {
      cardDragData = undefined
      e.detail.reset()
      return
    }

    const targetItems = items.get(targetState)
    const origItems = items.get(origState)
    const targetItem = origItems?.find((x) => x._id === e.detail.id)

    cardDragData = undefined

    if (panel === undefined || targetItems === undefined || origItems === undefined || targetItem === undefined) {
      e.detail.reset()
      return
    }

    const itemIdx = targetItems.findIndex((x) => x._id === item?.id)
    const idx = item === undefined || itemIdx < -1 ? targetItems.length : item.state.bottom ? itemIdx + 1 : itemIdx

    if (targetState !== origState) {
      const updatedOrigItems = origItems?.filter((x) => x._id !== targetItem._id)
      items.set(origState, updatedOrigItems)
    }

    const updatedTargetItems = [...targetItems.slice(0, idx), targetItem, ...targetItems.slice(idx)].filter(
      (x, i) => x._id !== targetItem._id || idx === i
    )

    items.set(targetState, updatedTargetItems)
    items = items

    dispatch('drop', { item: e.detail.id, idx, state: panel.id })
  }

  function onCardDragOver (e: CustomEvent<DragOverEvent>) {
    if (cardDragData === undefined) {
      return
    }

    cardDragData = {
      ...cardDragData,
      over: {
        ...(cardDragData.over ?? {}),
        card: e.detail.id,
        state: e.detail.state
      }
    }
  }

  function onCardDragOverEnd (e: CustomEvent<DragOverEndEvent>) {
    if (cardDragData === undefined || cardDragData.over.card !== e.detail.id) {
      return
    }

    cardDragData = {
      ...cardDragData,
      over: {
        ...(cardDragData.over ?? {}),
        card: undefined,
        state: undefined
      }
    }
  }

  function onPanelDragStart (e: CustomEvent<DragStartEvent>) {
    panelDragData = {
      ...(panelDragData ?? {}),
      id: e.detail.id,
      size: e.detail.size,
      over: {}
    }
  }

  function onPanelDragEnd (e: CustomEvent<DragEndEvent>) {
    const panel = e.detail.hoveredItems.find((x) => x.type === ObjectType.Panel)
    const root = e.detail.hoveredItems.find((x) => x.type === ObjectType.Root)
    const state = states.find((x) => x._id === panelDragData?.id)

    if (root === undefined || state === undefined) {
      panelDragData = undefined
      e.detail.reset()
      return
    }

    const itemIdx = states.findIndex((x) => x._id === panel?.id)
    const idx = itemIdx === -1 ? states.length : itemIdx + (panel?.state.right ?? false ? 1 : 0)

    states = [...states.slice(0, idx), state, ...states.slice(idx)].filter((x, i) => x._id !== state._id || i === idx)

    dispatch('stateReorder', { item: e.detail.id, idx })

    panelDragData = undefined
  }

  function onPanelDragOver (e: CustomEvent<DragOverEvent>) {
    if (e.detail.type === ObjectType.Card) {
      if (cardDragData === undefined) {
        return
      }

      cardDragData = {
        ...cardDragData,
        over: {
          ...(cardDragData.over ?? {}),
          panel: e.detail.id
        }
      }
    }

    if (e.detail.type === ObjectType.Panel) {
      if (panelDragData === undefined) {
        return
      }

      panelDragData = {
        ...panelDragData,
        over: {
          panel: e.detail.id,
          state: e.detail.state
        }
      }
    }
  }

  function onPanelDragOverEnd (e: CustomEvent<DragOverEndEvent>) {
    if (e.detail.type === ObjectType.Card) {
      if (cardDragData === undefined || cardDragData.over.panel !== e.detail.id) {
        return
      }

      cardDragData = {
        ...cardDragData,
        over: {
          ...(cardDragData.over ?? {}),
          panel: undefined
        }
      }
    }

    if (e.detail.type === ObjectType.Panel) {
      if (panelDragData === undefined || e.detail.id !== panelDragData.over.panel) {
        return
      }

      panelDragData = {
        ...panelDragData,
        over: {}
      }
    }
  }

  let disabledPanels: Set<string> = new Set()
  $: if (transitions !== undefined) {
    if (cardDragData === undefined) {
      disabledPanels = new Set()
    } else {
      disabledPanels = new Set(
        states
          .map((x) => x._id)
          .filter((x) => x !== cardDragData?.item.state)
          .filter((x) => !transitions?.get(cardDragData?.item.state ?? '')?.has(x))
      )
    }
  }
</script>

<div
  class="root"
  use:scrollable={{ watcher: dragWatcher }}
  use:hoverable={{ id: generateId(), allowedTypes: [ObjectType.Panel], type: ObjectType.Root, watcher: dragWatcher }}
>
  {#each states as state, idx (state._id)}
    <div
      class="panel-container"
      use:draggable={{ id: state._id, watcher: dragWatcher, disabled: panelDragDisabled, type: ObjectType.Panel }}
      on:dragStart={onPanelDragStart}
      on:dragEnd={onPanelDragEnd}
      use:hoverable={{
        id: state._id,
        watcher: dragWatcher,
        disabled: disabledPanels.has(state._id),
        type: ObjectType.Panel,
        allowedTypes: [ObjectType.Panel]
      }}
      on:dragOver={onPanelDragOver}
      on:dragOverEnd={onPanelDragOverEnd}
    >
      <div
        class="transformable-panel"
        style={panelDragData !== undefined && panelShiftIdx <= idx && state._id !== panelDragData?.id
          ? `transform: translate3d(${panelDragData.size.width}px, 0px, 0px);`
          : ''}
      >
        <Panel
          title={state.name}
          counter={actualItems[idx].length}
          color={state.color}
          id={state._id}
          disabled={disabledPanels.has(state._id)}
          on:dragOver={onPanelDragOver}
          on:dragOverEnd={onPanelDragOverEnd}
        >
          {#each actualItems[idx] as item, itemIdx (item._id)}
            <div
              class="card-container"
              use:draggable={{ id: item._id, watcher: dragWatcher, ctx: { state: state._id }, type: ObjectType.Card }}
              use:hoverable={{
                id: item._id,
                watcher: dragWatcher,
                disabled: disabledPanels.has(state._id),
                type: ObjectType.Card,
                ctx: { group: state._id }
              }}
              on:dragOver={onCardDragOver}
              on:dragOverEnd={onCardDragOverEnd}
              on:dragStart={onCardDragStart}
              on:dragEnd={onCardDragEnd}
            >
              <div
                class="transformable-card"
                style={cardDragData?.over !== undefined &&
                cardDragData.over.panel === state._id &&
                cardShiftIdx <= itemIdx &&
                item._id !== cardDragData.id
                  ? `transform: translate3d(0px, ${cardDragData.size.height}px, 0px);`
                  : ''}
              >
                <Card component={cardComponent} doc={item} />
              </div>
            </div>
          {/each}
          {#if cardDragData?.over !== undefined && cardDragData.over.panel === state._id}
            <div style={`height: ${cardDragData.size.height}px;`} />
          {/if}
        </Panel>
      </div>
    </div>
  {/each}
  {#if panelDragData !== undefined}
    <div style={`min-width: ${panelDragData.size.width}px;`} />
  {/if}
</div>

<style lang="scss">
  .root {
    display: flex;
    padding: 0 40px 10px 40px;
    height: 100%;

    overflow-x: auto;

    margin-bottom: 20px;
  }

  .panel-container {
    height: 100%;
    padding: 0 5px;

    &:first-child {
      padding-left: 0;
    }

    &:last-child {
      padding-right: 0;
    }
  }

  .card-container {
    padding: 5px 0;

    &:first-child {
      padding-top: 0;
    }

    &:last-child {
      padding-bottom: 0;
    }
  }

  .transformable-card,
  .transformable-panel {
    transition-timing-function: ease-in;
    transition: transform 200ms;
  }

  .transformable-panel {
    height: 100%;
  }
</style>
