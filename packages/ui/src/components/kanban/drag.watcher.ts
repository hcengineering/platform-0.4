/* eslint-disable @typescript-eslint/consistent-type-assertions */
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

import { generateId } from '@anticrm/core'

interface BaseItem {
  id: string
  type: string
  node: HTMLElement | (() => HTMLElement | undefined)
}

export interface DragOverListener extends BaseItem {
  onDragOver: (event: { x: number, y: number, id: string, type: string }) => void
  onDragEnd: (event: { id: string, type: string }) => void
}

interface CompleteDragOverListener extends DragOverListener {
  internalID: string
}

type HoveredItem = BaseItem & { node: HTMLElement }
export type HoveredItems = HoveredItem[]

export default class DragWatcher {
  private readonly listeners = new Map<string, CompleteDragOverListener>()
  private readonly draggables = new Map<string, BaseItem>()
  private hovered = new Set<string>()
  private dragged: string | undefined
  private x = -1
  private y = -1

  regDraggable (item: BaseItem): [string, () => void] {
    const internalID = generateId()
    this.draggables.set(internalID, item)

    return [
      internalID,
      () => {
        if (this.dragged === internalID) {
          this.dragEnd()
        }

        this.draggables.delete(internalID)
      }
    ]
  }

  listen (listener: DragOverListener): () => void {
    const internalID = generateId()
    this.listeners.set(internalID, {
      internalID,
      ...listener
    })

    // In case item shift occured
    if (this.dragged !== undefined) {
      this.dragMove(this.dragged, this.x, this.y)
    }

    return () => {
      this.listeners.delete(internalID)

      if (this.hovered.has(internalID)) {
        this.hovered.delete(internalID)

        // Recalc item under draggable element
        if (this.dragged !== undefined) {
          this.dragMove(this.dragged, this.x, this.y)
        }
      }
    }
  }

  getNode (item: BaseItem): HTMLElement | undefined {
    if (typeof item.node === 'function') {
      return item.node()
    }

    return item.node
  }

  dragMove (dragged: string, x: number, y: number): void {
    const draggedItem = this.draggables.get(dragged)

    if (draggedItem === undefined) {
      return
    }

    this.x = x
    this.y = y
    this.dragged = dragged

    const candidates = [...this.listeners.values()].filter((c) => c.id !== draggedItem.id)
    const target = candidates.filter((c) => {
      const node = this.getNode(c)

      return node !== undefined && this.isPointInside(node, x, y)
    })

    const missing = [...this.hovered].filter((h) => !target.some((t) => t.internalID === h))

    missing.forEach((m) => {
      this.listeners.get(m)?.onDragEnd({ id: draggedItem.id, type: draggedItem.type })
    })

    this.hovered = new Set(target.map((x) => x.internalID))

    target.forEach((t) => {
      this.notifyDragOverListener(t.internalID, draggedItem, x, y)
    })
  }

  private isPointInside (node: HTMLElement, x: number, y: number): boolean {
    const { top, left, width, height } = node.getBoundingClientRect()

    return x >= left && x <= left + width && y >= top && y <= top + height
  }

  private notifyDragOverListener (id: string, dragged: BaseItem, x: number, y: number): void {
    const listener = this.listeners.get(id)

    if (listener === undefined) {
      return
    }

    listener.onDragOver({ x, y, id: dragged.id, type: dragged.type })
  }

  dragEnd (): void {
    const draggedItem = this.draggables.get(this.dragged ?? '')
    this.dragged = undefined
    this.x = -1
    this.y = -1

    if (draggedItem === undefined) {
      return
    }

    this.hovered.forEach((h) => {
      this.listeners.get(h)?.onDragEnd({ id: draggedItem.id, type: draggedItem.type })
    })
    this.hovered = new Set()
  }

  getHoveredItems (): HoveredItems {
    return [...this.hovered]
      .map((x) => this.listeners.get(x))
      .map((listener) =>
        listener === undefined
          ? undefined
          : ({
              ...listener,
              node: this.getNode(listener)
            } as HoveredItem)
      )
      .filter((x): x is HoveredItem => x?.node !== undefined)
  }
}
