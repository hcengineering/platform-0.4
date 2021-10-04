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

import { deepEqual } from 'fast-equals'

import DragWatcher from './drag.watcher'
import type { State } from './utils'
import { getHoverState } from './utils'

interface BaseDragOverEvent {
  id: string // hoverable id
  type: string // draggable type
  ctx?: any // ctx provided by use:hoverable={{ctx: ...}}
}

export interface DragOverEvent extends BaseDragOverEvent {
  state: State
}

export interface DragOverEndEvent extends BaseDragOverEvent {}

interface Data {
  id: string
  disabled?: boolean
  watcher: DragWatcher
  type: string
  allowedTypes?: string[]
  ctx?: any
}

const initialState = {
  left: false,
  top: false,
  right: false,
  bottom: false
}

function createHoverable (node: HTMLElement, data: Data): () => State {
  if (data.disabled === true) {
    return () => initialState
  }

  const dragWatcher = data.watcher
  let lastState = initialState

  const unsub = dragWatcher.listen({
    id: data.id,
    node,
    type: data.type,
    onDragEnd: (e) => {
      if (data?.allowedTypes !== undefined && !data.allowedTypes.includes(e.type)) {
        return
      }

      lastState = initialState
      node.dispatchEvent(
        new CustomEvent<DragOverEndEvent>('dragOverEnd', { detail: { id: data.id, type: e.type, ctx: data.ctx } })
      )
    },
    onDragOver: (e) => {
      if (data?.allowedTypes !== undefined && !data.allowedTypes.includes(e.type)) {
        return
      }

      const newState = getHoverState(node, e.x, e.y)

      if (deepEqual(newState, lastState)) {
        return
      }

      lastState = newState
      node.dispatchEvent(
        new CustomEvent<DragOverEvent>('dragOver', {
          detail: { id: data.id, type: e.type, state: lastState, ctx: data.ctx }
        })
      )
    }
  })

  return () => {
    unsub()
    return lastState
  }
}

export function hoverable (node: HTMLElement, data: Data): any {
  let isDisabled = data.disabled
  let unsub = createHoverable(node, data)

  return {
    destroy: () => {
      const lastState = unsub()

      if (Object.values(lastState).some((x) => x)) {
        node.dispatchEvent(new CustomEvent<DragOverEndEvent>('dragOverEnd', { detail: data }))
      }
    },
    update: (newData: Data) => {
      if (isDisabled !== newData.disabled) {
        unsub()
        unsub = createHoverable(node, newData)
        isDisabled = newData.disabled
      }
    }
  }
}
