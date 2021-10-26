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

import DragWatcher from './drag.watcher'
import type { State } from './utils'
import { getHoverState } from './utils'

export interface DragEvent {
  id: string
  ctx?: any
}

export interface DragStartEvent extends DragEvent {
  size: {
    height: number
    width: number
  }
}

type Coord = [number, number]

interface DragInfo {
  lastPos: Coord
  style: Record<string, string>
}

export interface DragEndEvent extends DragEvent {
  reset: () => void
  forced: boolean
  node: HTMLElement
  dragInfo?: DragInfo
  hoveredItems: Array<{
    id: string
    type: string
    state: State
  }>
}

class Draggable {
  private isClick = false
  private isMoved = false
  private downPos: Coord = [-1, -1]
  private lastPos: Coord = [-1, -1]
  private readonly moveThreshold = 10

  constructor (
    private readonly node: HTMLElement,
    private readonly onstart: (e: { x: number, y: number }) => void,
    private readonly onmove: (e: { x: number, y: number, dx: number, dy: number }) => void,
    private readonly onend: (e: { x: number, y: number, forced: boolean, lastPos?: Coord }) => void,
    lastPos?: Coord
  ) {
    node.setAttribute('x-type', 'draggable')
    node.addEventListener('click', this.handleClick, true)
    node.addEventListener('mousedown', this.handleMouseDown)

    // If lastPos is not undefined that means specific item is dragging right now
    if (lastPos !== undefined) {
      this.lastPos = lastPos
      this.isMoved = true
      this.onstart({ x: lastPos[0], y: lastPos[1] })
      window.addEventListener('mouseup', this.handleMouseUp)
      window.addEventListener('mousemove', this.handleMouseMove)
    }
  }

  cleanup (): void {
    this.node.removeAttribute('x-type')
    this.node.removeEventListener('click', this.handleClick, true)
    this.node.removeEventListener('mousedown', this.handleMouseDown)

    // In case we got element destroyed before mouseup
    window.removeEventListener('mousemove', this.handleMouseMove)
    window.removeEventListener('mouseup', this.handleMouseUp)

    if (this.isMoved) {
      this.onend({ x: this.lastPos[0], y: this.lastPos[1], forced: true, lastPos: this.lastPos })
      this.lastPos = [-1, -1]
      this.downPos = [-1, -1]
    }
  }

  private readonly handleClick = (e: MouseEvent): void => {
    const targetDraggable = this.findClosestDraggable(e.target as HTMLElement)
    if (targetDraggable !== this.node) {
      return
    }

    if (!this.isClick) {
      e.stopPropagation()
    } else {
      this.isClick = false
    }
  }

  private findClosestDraggable (leaf: HTMLElement | null): HTMLElement | null {
    if (leaf === null) {
      return null
    }

    if (leaf.getAttribute('x-type') !== 'draggable') {
      return this.findClosestDraggable(leaf.parentElement)
    }

    return leaf
  }

  private findClosestHTMLElement (leaf: Element | null, root: HTMLElement): HTMLElement | null {
    if (leaf === null || leaf === root) {
      return null
    }

    if (leaf instanceof HTMLElement) {
      return leaf
    }

    return this.findClosestHTMLElement(leaf.parentElement, root)
  }

  private readonly handleMouseDown = (e: MouseEvent): void => {
    // We must not handle mouse down if event is for inner draggable
    const targetDraggable = this.findClosestDraggable(e.target as HTMLElement)
    if (targetDraggable !== this.node) {
      return
    }

    e.preventDefault()
    this.downPos = [e.clientX, e.clientY]
    window.addEventListener('mouseup', this.handleMouseUp)
    window.addEventListener('mousemove', this.handleMouseMove)
  }

  private readonly handleMouseMove = (e: MouseEvent): void => {
    if (!this.isMoved) {
      const x = this.downPos[0] - e.clientX
      const y = this.downPos[1] - e.clientY
      const length = Math.sqrt(x * x + y * y)

      if (length < this.moveThreshold) {
        return
      }

      this.onstart({ x: e.clientX, y: e.clientY })
      this.isMoved = true
    }

    this.lastPos = [e.clientX, e.clientY]
    this.onmove({ x: e.clientX, y: e.clientY, dx: e.movementX, dy: e.movementY })
  }

  private readonly handleMouseUp = (e: MouseEvent): void => {
    window.removeEventListener('mousemove', this.handleMouseMove)
    window.removeEventListener('mouseup', this.handleMouseUp)
    // Click case
    if (!this.isMoved) {
      const target = this.findClosestHTMLElement(document.elementFromPoint(e.clientX, e.clientY), this.node)

      if (target !== null) {
        this.isClick = true
        target.click()
      }
    } else {
      this.onend({ x: e.clientX, y: e.clientY, forced: false })
    }

    this.isMoved = false
    this.lastPos = [-1, -1]
    this.downPos = [-1, -1]
  }
}

interface Data {
  id?: string
  watcher: DragWatcher
  type: string
  dragInfo?: DragInfo
  disabled?: boolean
  ctx?: any
}

function createDraggable (node: HTMLElement, data: Data): () => void {
  if (data.disabled === true || data.id === undefined) {
    return () => {}
  }

  const actualID = data.id

  const dragWatcher = data.watcher
  const [dragID, unsub] = dragWatcher.regDraggable({
    id: data.id,
    node,
    type: data.type
  })

  const clearStyles = (): void => {
    node.style.removeProperty('position')
    node.style.removeProperty('top')
    node.style.removeProperty('left')
    node.style.removeProperty('width')
    node.style.removeProperty('height')
    node.style.removeProperty('z-index')
  }

  const draggable = new Draggable(
    node,
    (e) => {
      const bbox = node.getBoundingClientRect()

      if (data.dragInfo === undefined) {
        node.style.position = 'fixed'
        node.style.top = `${bbox.top}px`
        node.style.left = `${bbox.left}px`
        node.style.width = `${bbox.width}px`
        node.style.height = `${bbox.height}px`
        node.style.zIndex = '2000'
      } else {
        Object.entries(data.dragInfo.style).forEach(([key, value]) => {
          node.style.setProperty(key, value)
        })
      }

      node.dispatchEvent(
        new CustomEvent<DragStartEvent>('dragStart', {
          detail: { ...data, id: actualID, size: { width: bbox.width, height: bbox.height } }
        })
      )
      dragWatcher.dragMove(dragID, e.x, e.y)
    },
    (e) => {
      const x = parseFloat(node.style.left ?? '0') + e.dx
      const y = parseFloat(node.style.top ?? '0') + e.dy

      node.style.top = `${y}px`
      node.style.left = `${x}px`

      dragWatcher.dragMove(dragID, e.x, e.y)
    },
    (e) => {
      const hoveredItems = dragWatcher.getHoveredItems()

      dragWatcher.dragEnd()

      node.dispatchEvent(
        new CustomEvent<DragEndEvent>('dragEnd', {
          detail: {
            id: actualID,
            ctx: data.ctx,
            node,
            forced: e.forced,
            dragInfo:
              e.lastPos !== undefined
                ? {
                    lastPos: e.lastPos,
                    style: {
                      position: node.style.position,
                      top: node.style.top,
                      left: node.style.left,
                      width: node.style.width,
                      height: node.style.height,
                      'z-index': node.style.zIndex
                    }
                  }
                : undefined,
            reset: clearStyles,
            hoveredItems: hoveredItems.map((item) => ({
              id: item.id,
              type: item.type,
              state: getHoverState(item.node, e.x, e.y)
            }))
          }
        })
      )
    },
    data.dragInfo?.lastPos
  )

  return () => {
    draggable.cleanup()
    unsub()
  }
}

export function draggable (node: HTMLElement, data: Data): any {
  let { id, disabled, dragInfo } = data
  let cleanup = createDraggable(node, data)

  return {
    destroy: () => {
      cleanup()
    },
    update: (newData: Data) => {
      if (newData.id !== id || newData.disabled !== disabled || newData.dragInfo !== dragInfo) {
        id = newData.id
        disabled = newData.disabled
        dragInfo = newData.dragInfo

        cleanup()
        cleanup = createDraggable(node, newData)
      }
    }
  }
}
