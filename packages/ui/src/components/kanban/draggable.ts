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

export interface DragEndEvent extends DragEvent {
  reset: () => void
  hoveredItems: Array<{
    id: string
    type: string
    state: State
  }>
}

class Draggable {
  private isClick = false
  private isMoved = false
  private downPos: [number, number] = [-1, -1]

  constructor (
    private readonly node: HTMLElement,
    private readonly onstart: (e: any) => void,
    private readonly onmove: (e: any) => void,
    private readonly onend: (e: any) => void
  ) {
    node.setAttribute('x-type', 'draggable')
    node.addEventListener('click', this.handleClick, true)
    node.addEventListener('mousedown', this.handleMouseDown)
  }

  cleanup (): void {
    this.node.removeAttribute('x-type')
    this.node.removeEventListener('click', this.handleClick, true)
    this.node.removeEventListener('mousedown', this.handleMouseDown)

    // In case we got element destroyed before mouseup
    window.removeEventListener('mousemove', this.handleMouseMove)
    window.removeEventListener('mouseup', this.handleMouseUp)
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
      this.onstart({ x: this.downPos[0], y: this.downPos[1] })
      this.isMoved = true
    }

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
      this.onend({ x: e.clientX, y: e.clientY })
    }

    this.isMoved = false
    this.downPos = [-1, -1]
  }
}

export function draggable (
  node: HTMLElement,
  data: { id: string, watcher: DragWatcher, type: string, disabled?: boolean, ctx?: any }
): any {
  if (data.disabled === true) {
    return
  }

  const dragWatcher = data.watcher
  const [dragID, unsub] = dragWatcher.regDraggable({
    id: data.id,
    node,
    type: data.type
  })

  let isDragging = false
  const clearStyles = (): void => {
    node.style.position = ''
    node.style.top = ''
    node.style.left = ''
    node.style.width = ''
    node.style.height = ''
    node.style.zIndex = ''
  }

  const draggable = new Draggable(
    node,
    (e) => {
      isDragging = true

      const bbox = node.getBoundingClientRect()
      node.style.position = 'fixed'
      node.style.top = `${bbox.top}px`
      node.style.left = `${bbox.left}px`
      node.style.width = `${bbox.width}px`
      node.style.height = `${bbox.height}px`
      node.style.zIndex = '2000'

      node.dispatchEvent(
        new CustomEvent<DragStartEvent>('dragStart', {
          detail: { ...data, size: { width: bbox.width, height: bbox.height } }
        })
      )
      dragWatcher.dragMove(dragID, e.x, e.y)
    },
    (e) => {
      const dx = e.dx as number
      const dy = e.dy as number
      const x = parseFloat(node.style.left ?? '0') + dx
      const y = parseFloat(node.style.top ?? '0') + dy

      node.style.top = `${y}px`
      node.style.left = `${x}px`

      dragWatcher.dragMove(dragID, e.x, e.y)
    },
    (e) => {
      isDragging = false

      const hoveredItems = dragWatcher.getHoveredItems()

      dragWatcher.dragEnd()

      node.dispatchEvent(
        new CustomEvent<DragEndEvent>('dragEnd', {
          detail: {
            id: data.id,
            ctx: data.ctx,
            reset: clearStyles,
            hoveredItems: hoveredItems.map((item) => ({
              id: item.id,
              type: item.type,
              state: getHoverState(item.node, e.x, e.y)
            }))
          }
        })
      )
    }
  )

  return {
    destroy: () => {
      draggable.cleanup()
      unsub()
    },
    update: () => {
      if (!isDragging) {
        clearStyles()
        dragWatcher.dragEnd()
      }
    }
  }
}
