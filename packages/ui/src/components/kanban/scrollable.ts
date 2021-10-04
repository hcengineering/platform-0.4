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

import DragWatcher from './drag.watcher'
import { ObjectType } from './object.types'

class Scroller {
  private x: number = 0
  private y: number = 0
  private cancelScroll = false
  private isScrolling = false

  constructor (private readonly node: HTMLElement) {}

  scroll (direction: { x?: number, y?: number }): void {
    this.x = direction.x ?? this.x
    this.y = direction.y ?? this.y

    if (this.x === 0 && this.y === 0) {
      if (this.isScrolling) {
        this.cancelScrollAction()
      }

      return
    }

    this.initScrollAction()
  }

  private initScrollAction (): void {
    if (this.isScrolling) {
      if (this.cancelScroll) {
        this.cancelScroll = false
      }

      return
    }

    this.isScrolling = true
    requestAnimationFrame(this.scrollAction)
  }

  private cancelScrollAction (): void {
    this.cancelScroll = true
  }

  private readonly scrollAction = (): void => {
    if (this.cancelScroll) {
      this.isScrolling = false
      return
    }

    const { scrollLeft, scrollTop } = this.node
    this.node.scroll(scrollLeft + this.x, scrollTop + this.y)

    requestAnimationFrame(this.scrollAction)
  }

  reset (): void {
    this.scroll({ x: 0, y: 0 })
  }
}

function isInBounds ([l, r]: [number, number], val: number): boolean {
  return val >= l && val < r
}

function getSpeed (val: number, threshold: number, max: number): number {
  return max - Math.ceil(val / (threshold / max))
}

function calcSpeed ({
  size,
  val,
  max = 16,
  areaPerc = 0.3
}: {
  size: number
  val: number
  max?: number
  areaPerc?: number
}): number {
  const threshold = size * areaPerc

  if (isInBounds([0, threshold], val)) {
    return -getSpeed(val, threshold, max)
  }

  if (isInBounds([size - threshold, size], val)) {
    return getSpeed(size - val, threshold, max)
  }

  return 0
}

interface Data {
  maxSpeed?: number
  disabled?: boolean
  watcher: DragWatcher
  allowedTypes?: string[]
}

function createScrollable (node: HTMLElement, data: Data): () => void {
  if (data.disabled === true) {
    return () => {}
  }

  const scroller = new Scroller(node)
  const dragWatcher = data.watcher
  const max = data?.maxSpeed ?? 16

  const unsub = dragWatcher.listen({
    id: generateId(),
    node,
    type: ObjectType.Common,
    onDragOver: (e) => {
      if (data?.allowedTypes !== undefined && !data.allowedTypes.includes(e.type)) {
        return
      }

      const { top, left } = node.getBoundingClientRect()
      const { offsetWidth, offsetHeight } = node

      scroller.scroll({
        y: calcSpeed({ size: offsetHeight, val: e.y - top, max }),
        x: calcSpeed({ size: offsetWidth, val: e.x - left, max })
      })
    },
    onDragEnd: (e) => {
      if (data?.allowedTypes !== undefined && !data.allowedTypes.includes(e.type)) {
        return
      }

      scroller.reset()
    }
  })

  return () => {
    unsub()
    scroller.reset()
  }
}

export function scrollable (node: HTMLElement, data: Data): any {
  let isDisabled = data.disabled
  let cleanup = createScrollable(node, data)

  return {
    destroy: () => {
      cleanup()
    },
    update: (newData: Data) => {
      if (isDisabled !== newData.disabled) {
        cleanup()
        cleanup = createScrollable(node, newData)
        isDisabled = newData.disabled
      }
    }
  }
}
