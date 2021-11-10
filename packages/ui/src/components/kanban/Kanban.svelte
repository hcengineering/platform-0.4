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
  import { createEventDispatcher, setContext, tick } from 'svelte'
  import { writable } from 'svelte/store'

  import { generateId } from '@anticrm/core'
  import type { UIComponent } from '@anticrm/status'

  import type { KanbanItem, KanbanState } from '../../types'
  import Add from '../icons/Add.svelte'
  import Label from '../Label.svelte'

  import ui from '../..'

  import Panel from './Panel.svelte'

  import { draggable } from './draggable'
  import type { DragStartEvent, DragEndEvent } from './draggable'
  import { scrollable } from './scrollable'
  import DragWatcher from './drag.watcher'
  import type { DragOverEndEvent, DragOverEvent } from './hoverable'
  import { hoverable } from './hoverable'
  import type { State as HoverState } from './utils'
  import { ObjectType } from './object.types'

  export let items: Map<string, KanbanItem[]>
  export let states: KanbanState[] = []
  export let transitions: Map<string, Set<string>> | undefined = undefined
  export let cardComponent: UIComponent
  export let cardDelay: number = 0

  let itemsCopy: Map<string, KanbanItem[]>
  $: copyItems(items)

  function copyItems (m: Map<string, KanbanItem[]>) {
    itemsCopy = new Map(m)
  }

  // Temporary flag, need to remove as soon as tasks plugin be updated
  export let panelEditDisabled = false

  const dragWatcher = new DragWatcher()
  setContext('dragWatcher', dragWatcher)

  const dragCardSize = writable({ width: 0, height: 0 })
  setContext('dragCardSize', dragCardSize)

  const dispatch = createEventDispatcher()

  let actualItems: KanbanItem[][] = []
  $: actualItems = states.map((state) => itemsCopy.get(state._id) ?? [])

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

  let dragItemState: string | undefined

  function onCardDragStart (e: CustomEvent<DragStartEvent>) {
    dragCardSize.set(e.detail.size)
    dragItemState = e.detail.ctx.state
  }

  async function onCardDragEnd (e: CustomEvent<DragEndEvent>) {
    dragItemState = undefined
    const panel = e.detail.hoveredItems.find((x) => x.type === ObjectType.Panel)
    const item = e.detail.hoveredItems.find((x) => x.type === ObjectType.Card)
    const targetState = panel?.id
    const origState = e.detail.ctx.state

    if (targetState === undefined || origState === undefined) {
      e.detail.reset()
      return
    }

    const targetItems = itemsCopy.get(targetState)
    const origItems = itemsCopy.get(origState)
    const targetItem = origItems?.find((x) => x._id === e.detail.id)

    if (panel === undefined || targetItems === undefined || origItems === undefined || targetItem === undefined) {
      e.detail.reset()
      return
    }

    const itemIdx = targetItems.findIndex((x) => x._id === item?.id)
    const idx = item === undefined || itemIdx < -1 ? targetItems.length : item.state.bottom ? itemIdx + 1 : itemIdx

    if (targetState !== origState) {
      const updatedOrigItems = origItems?.filter((x) => x._id !== targetItem._id)
      itemsCopy.set(origState, updatedOrigItems)
    }

    const updatedTargetItems = [...targetItems.slice(0, idx), targetItem, ...targetItems.slice(idx)].filter(
      (x, i) => x._id !== targetItem._id || idx === i
    )

    itemsCopy.set(targetState, updatedTargetItems)
    itemsCopy = itemsCopy

    dispatch('drop', { item: e.detail.id, idx, prevState: origState, state: panel.id })

    await tick()
    e.detail.reset()
  }

  function onPanelDragStart (e: CustomEvent<DragStartEvent>) {
    panelDragData = {
      ...(panelDragData ?? {}),
      id: e.detail.id,
      size: e.detail.size,
      over: {}
    }
  }

  async function onPanelDragEnd (e: CustomEvent<DragEndEvent>) {
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
    await tick()
    e.detail.reset()
  }

  function onPanelDragOver (e: CustomEvent<DragOverEvent>) {
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

  function onPanelDragOverEnd (e: CustomEvent<DragOverEndEvent>) {
    if (panelDragData === undefined || e.detail.id !== panelDragData.over.panel) {
      return
    }

    panelDragData = {
      ...panelDragData,
      over: {}
    }
  }

  let disabledPanels: Set<string> = new Set()
  $: if (transitions !== undefined) {
    if (dragItemState === undefined) {
      disabledPanels = new Set()
    } else {
      disabledPanels = new Set(
        states
          .map((x) => x._id)
          .filter((x) => x !== dragItemState)
          .filter((x) => !transitions?.get(dragItemState ?? '')?.has(x))
      )
    }
  }

  function onColumnAdd () {
    dispatch('columnAdd')
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
      use:draggable={{ id: state._id, watcher: dragWatcher, disabled: panelEditDisabled, type: ObjectType.Panel }}
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
          color={state.color}
          id={state._id}
          disabled={disabledPanels.has(state._id)}
          items={actualItems[idx]}
          {panelEditDisabled}
          {cardDelay}
          {cardComponent}
          on:cardDragStart={onCardDragStart}
          on:cardDragEnd={onCardDragEnd}
          on:columnRename
          on:columnRemove
        />
      </div>
    </div>
  {/each}
  {#if panelDragData !== undefined}
    <div style={`min-width: ${panelDragData.size.width}px;`} />
  {:else if !panelEditDisabled}
    <div class="add-column" on:click={onColumnAdd}>
      <div class="add-column-icon">
        <Add size={24} />
      </div>
      <div class="add-column-label">
        <Label label={ui.string.AddNewColumn} />
      </div>
    </div>
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

  .transformable-panel {
    transition-timing-function: ease-in;
    transition: transform 200ms;
    height: 100%;
  }

  .add-column {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;

    cursor: pointer;

    width: 320px;
    min-width: 320px;
    height: 100%;

    border: 1px dashed rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    background-color: var(--theme-button-bg-enabled);

    margin: 0 5px;
  }

  .add-column-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;

    width: 80px;
    height: 80px;

    background-color: rgba(255, 255, 255, 0.03);
  }

  .add-column-label {
    padding-top: 20px;
    font-size: 14px;
    user-select: false;

    color: var(--theme-caption-color);
  }
</style>
