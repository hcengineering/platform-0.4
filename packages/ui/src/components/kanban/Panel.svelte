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
  import { createEventDispatcher, getContext } from 'svelte'
  import type { Readable } from 'svelte/store'

  import type { IntlString, UIComponent } from '@anticrm/status'

  import ui from '../..'
  import type { KanbanItem } from '../../types'

  import Label from '../Label.svelte'
  import EditBox from '../EditBox.svelte'
  import ActionIcon from '../ActionIcon.svelte'
  import VirtualList, { sty } from '../VirtualList.svelte'
  import IconClose from '../icons/Close.svelte'

  import ScrollRenderer from './ScrollRenderer.svelte'
  import Card from './Card.svelte'

  import { scrollable } from './scrollable'
  import { hoverable } from './hoverable'
  import type { DragOverEndEvent, DragOverEvent } from './hoverable'
  import { draggable } from './draggable'
  import type { DragEndEvent, DragStartEvent } from './draggable'
  import DragWatcher from './drag.watcher'
  import { ObjectType } from './object.types'
  import type { State as HoverState } from './utils'

  export let title: IntlString | string
  export let color: string = '#F28469'
  export let id: string = ''
  export let items: KanbanItem[] = []
  export let cardComponent: UIComponent
  export let disabled: boolean = false
  export let cardDelay: number
  export let panelEditDisabled: boolean

  const dispatch = createEventDispatcher()
  let dragPreview: HTMLElement

  const dragWatcher = getContext<DragWatcher>('dragWatcher')
  const dragCardSize = getContext<Readable<{ width: number; height: number }>>('dragCardSize')

  let dragID: string | undefined
  let dragInfo: DragEndEvent['dragInfo']
  function onInitCardDragStart (e: CustomEvent<DragStartEvent>) {
    dragID = e.detail.id

    dispatch('cardDragStart', e.detail)
  }

  function onInitCardDragEnd (e: CustomEvent<DragEndEvent>) {
    if (e.detail.forced && e.detail.node.firstChild !== null) {
      dragInfo = e.detail.dragInfo

      const clone = e.detail.node.firstChild.cloneNode(true)
      dragPreview.appendChild(clone)
    }
  }

  function onCardDragEnd (e: CustomEvent<DragEndEvent>) {
    dragID = undefined
    dragInfo = undefined

    while (dragPreview.firstChild) {
      dragPreview.firstChild.remove()
    }

    dispatch('cardDragEnd', e.detail)
  }

  let dragOverData:
    | {
        item: KanbanItem
        state: HoverState
      }
    | undefined
  function onCardDragOver (e: CustomEvent<DragOverEvent>) {
    const item = items.find((x) => x._id === e.detail.id)

    if (item === undefined) {
      return
    }

    dragOverData = { item, state: e.detail.state }
  }

  function onCardDragOverEnd (e: CustomEvent<DragOverEndEvent>) {
    if (dragOverData?.item._id !== e.detail.id) {
      return
    }

    dragOverData = undefined
  }

  let shiftIdx = Infinity
  $: if (dragOverData !== undefined) {
    const actualDragOverData = dragOverData
    const cardIdx = actualItems.findIndex((x) => x._id === actualDragOverData.item._id)

    if (cardIdx === -1) {
      shiftIdx = Infinity
    } else {
      shiftIdx = cardIdx + (dragOverData.state.bottom ? 1 : 0)
    }
  } else {
    shiftIdx = Infinity
  }

  let isHovered = false

  function onPanelDragOver () {
    isHovered = true
  }

  function onPanelDragOverEnd () {
    isHovered = false
  }

  let collapsed: boolean = false

  const GAP_ID = 'GAP_ITEM'
  let actualItems: KanbanItem[] = []
  let draggedItem: KanbanItem | undefined
  $: {
    actualItems = items.filter((x) => x._id !== dragID)
    draggedItem = dragID ? items.find((x) => x._id === dragID) : undefined

    if (isHovered) {
      actualItems = [
        ...actualItems,
        {
          _id: GAP_ID,
          state: ''
        }
      ]
    }

    actualItems = actualItems
  }

  const getScrollableNode = (node: HTMLElement): HTMLElement | undefined =>
    node.children[1]?.children[0] as HTMLElement | undefined

  let list: any
  let cardHeight = 80
  let cardHeightInitialized = false

  function setHeight (height: number) {
    if (cardHeightInitialized) {
      return
    }

    cardHeightInitialized = true
    cardHeight = height + 10
    setTimeout(() => list.reset())
  }

  $: if (items) {
    list?.reset()
  }

  const getKey = (index: number): string => actualItems[index]?._id ?? ''
  const getHeight = (idx: number) => (idx > items.length - 1 ? $dragCardSize.height : cardHeight)

  function onColumnRename () {
    dispatch('columnRename', {
      id,
      title
    })
  }

  function onColumnRemove () {
    dispatch('columnRemove', { id })
  }

  let isHoveredByMouse = false
  let showDeleteButton = false
  $: showDeleteButton = !collapsed && isHoveredByMouse && items.length === 0
</script>

<section
  class="panel-kanban"
  class:collapsed
  class:disabled
  on:mouseenter={() => (isHoveredByMouse = true)}
  on:mouseleave={() => (isHoveredByMouse = false)}
>
  <div
    class="header"
    class:collapsed
    style="background-color: {color}"
    on:click={() => {
      collapsed = !collapsed
    }}
  >
    {#if collapsed !== true}
      <div class="title">
        {#if panelEditDisabled}
          <Label label={title} />
        {:else}
          <EditBox maxWidth="245px" bind:value={title} on:blur={onColumnRename} />
        {/if}
      </div>
    {/if}
    {#if showDeleteButton && !panelEditDisabled}
      <ActionIcon icon={IconClose} action={onColumnRemove} size={16} label={ui.string.Remove} direction="top" />
    {:else}
      <div class="counter">{items.length}</div>
    {/if}
  </div>
  {#if collapsed !== true}
    <div class="container">
      <div
        class="full-size-container"
        use:scrollable={{ watcher: dragWatcher, disabled, allowedTypes: [ObjectType.Card], getNode: getScrollableNode }}
        use:hoverable={{ id, type: ObjectType.Panel, watcher: dragWatcher, disabled, allowedTypes: [ObjectType.Card] }}
        on:dragOver={onPanelDragOver}
        on:dragOverEnd={onPanelDragOverEnd}
      >
        <div
          bind:this={dragPreview}
          use:draggable={{
            id: draggedItem?._id ?? `preview-${id}`,
            watcher: dragWatcher,
            ctx: { state: id },
            dragInfo,
            type: ObjectType.Card
          }}
          on:dragEnd={onCardDragEnd}
        />
        <VirtualList bind:this={list} itemCount={actualItems.length} let:items itemKey={getKey} itemSize={getHeight}>
          {#each items as item (item.key)}
            {#if item.key !== GAP_ID}
              <div
                class="card-container"
                style={sty(item.style)}
                use:draggable={{
                  id: item.key,
                  watcher: dragWatcher,
                  ctx: { state: id },
                  type: ObjectType.Card
                }}
                use:hoverable={{
                  id: item.key,
                  watcher: dragWatcher,
                  disabled,
                  type: ObjectType.Card,
                  allowedTypes: [ObjectType.Card],
                  ctx: { state: id }
                }}
                on:dragOver={onCardDragOver}
                on:dragOverEnd={onCardDragOverEnd}
                on:dragStart={onInitCardDragStart}
                on:dragEnd={onInitCardDragEnd}
              >
                <div
                  class="transformable-card"
                  style={shiftIdx <= item.index ? `transform: translate3d(0px, ${$dragCardSize.height}px, 0px);` : ''}
                >
                  <ScrollRenderer let:ready delay={cardDelay} isScrolling={item.isScrolling}>
                    {#if ready && actualItems[item.index]}
                      <Card
                        component={cardComponent}
                        doc={actualItems[item.index]}
                        on:sizeChange={(ev) => {
                          setHeight(ev.detail[1])
                        }}
                      />
                    {/if}
                  </ScrollRenderer>
                </div>
              </div>
            {:else}
              <div style={`height: ${$dragCardSize.height}px;`} />
            {/if}
          {/each}
        </VirtualList>
      </div>
    </div>
  {/if}
</section>

<style lang="scss">
  .panel-kanban {
    display: flex;
    flex-direction: column;
    align-items: stretch;

    min-width: 320px;
    height: 100%;
    background-color: var(--theme-kanban-panel-bg);
    border-radius: 12px;

    transition: opacity 500ms;

    &.collapsed {
      min-width: 80px;
      width: 80px;
    }

    &.disabled {
      opacity: 0.4;
    }
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    margin: 12px;
    padding: 0 8px;
    min-height: 44px;

    color: #fff;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 8px;

    cursor: pointer;

    &.collapsed {
      justify-content: center;
    }
  }
  .title {
    padding-left: 8px;
    font-weight: 500;
  }
  .counter {
    display: flex;
    justify-content: center;
    align-items: center;

    width: 28px;
    height: 28px;

    font-weight: 600;

    background-color: rgba(47, 47, 52, 0.09);
    border-radius: 50%;
  }

  .container {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .full-size-container {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;

    padding: 12px;
    margin-right: -6px;
  }

  .card-container {
    border: 1px;
    padding-right: 6px;
  }

  .transformable-card {
    height: 100%;
    transition-timing-function: ease-in;
    transition: transform 200ms;
  }
</style>
