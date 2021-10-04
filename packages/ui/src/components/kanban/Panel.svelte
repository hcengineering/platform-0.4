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

  import type { KanbanItem } from '../../types'

  import Label from '../Label.svelte'
  import Grid from '../Grid.svelte'

  import Card from './Card.svelte'

  import { scrollable } from './scrollable'
  import { hoverable } from './hoverable'
  import type { DragOverEndEvent, DragOverEvent } from './hoverable'
  import { draggable } from './draggable'
  import type { DragEndEvent, DragStartEvent } from './draggable'
  import DragWatcher from './drag.watcher'
  import { ObjectType } from './object.types'
  import type { State as HoverState } from './utils'

  export let title: IntlString
  export let color: string = '#F28469'
  export let id: string = ''
  export let items: KanbanItem[] = []
  export let cardComponent: UIComponent
  export let disabled: boolean = false

  const dispatch = createEventDispatcher()

  const dragWatcher = getContext<DragWatcher>('dragWatcher')
  const dragCardSize = getContext<Readable<{ width: number; height: number }>>('dragCardSize')

  let dragID: string | undefined
  function onCardDragStart (e: CustomEvent<DragStartEvent>) {
    dragID = e.detail.id

    dispatch('cardDragStart', e.detail)
  }

  function onCardDragEnd (e: CustomEvent<DragEndEvent>) {
    dragID = undefined

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
    const cardIdx = items.findIndex((x) => x._id === actualDragOverData.item._id)

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
</script>

<section class="panel-kanban" class:collapsed class:disabled>
  <div
    class="header"
    class:collapsed
    style="background-color: {color}"
    on:click={() => {
      collapsed = !collapsed
    }}
  >
    {#if collapsed !== true}<div class="title"><Label label={title} /></div>{/if}
    <div class="counter">{items.length}</div>
  </div>
  {#if collapsed !== true}
    <div class="scroll-container">
      <div
        class="scroll"
        use:scrollable={{ watcher: dragWatcher, disabled, allowedTypes: [ObjectType.Card] }}
        use:hoverable={{ id, type: ObjectType.Panel, watcher: dragWatcher, disabled, allowedTypes: [ObjectType.Card] }}
        on:dragOver={onPanelDragOver}
        on:dragOverEnd={onPanelDragOverEnd}
      >
        <Grid column={1} rowGap={0}>
          {#each items as item, itemIdx (item._id)}
            <div
              class="card-container"
              use:draggable={{
                id: item._id,
                watcher: dragWatcher,
                ctx: { state: id },
                type: ObjectType.Card
              }}
              use:hoverable={{
                id: item._id,
                watcher: dragWatcher,
                disabled,
                type: ObjectType.Card,
                ctx: { state: id }
              }}
              on:dragOver={onCardDragOver}
              on:dragOverEnd={onCardDragOverEnd}
              on:dragStart={onCardDragStart}
              on:dragEnd={onCardDragEnd}
            >
              <div
                class="transformable-card"
                style={shiftIdx <= itemIdx && item._id !== dragID
                  ? `transform: translate3d(0px, ${$dragCardSize.height}px, 0px);`
                  : ''}
              >
                <Card component={cardComponent} doc={item} />
              </div>
            </div>
          {/each}
          {#if isHovered}
            <div style={`height: ${$dragCardSize.height}px;`} />
          {/if}
        </Grid>
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
    background-color: var(--theme-bg-accent-color);
    border: 1px solid var(--theme-bg-accent-color);
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

  .scroll-container {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .scroll {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;

    padding: 12px;

    overflow-y: auto;
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

  .transformable-card {
    transition-timing-function: ease-in;
    transition: transform 200ms;
  }
</style>
