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

import { Readable, Writable, writable, readable, derived } from 'svelte/store'
import debounce from 'lodash.debounce'

interface Size {
  width: number
  height: number
}

interface GridProps {
  size: Readable<Size>
  amount: Writable<number>
  containerSize: Readable<Size>
}

export function initGridStore (): GridProps {
  return {
    amount: writable(0),
    size: readable({ width: 0, height: 0 }, () => {}),
    containerSize: readable({ width: 0, height: 0 }, () => {})
  }
}

export function makeGridSizeStore (container: Element, initAmount: number): GridProps {
  const containerSize = readable<Size>({ width: 0, height: 0 }, set => {
    const debouncedSet = debounce(set, 150)
    const observer = new ResizeObserver(
      ([{ contentRect: { width, height } }]) => debouncedSet({ width, height })
    )

    observer.observe(container)

    return () => observer.unobserve(container)
  })

  const amountStore = writable(initAmount)

  return {
    size: derived([amountStore, containerSize], ([amount, size]) => {
      return Array(amount).fill(0).map((_, i) => i + 1)
        .map(rowSize => {
          const columnsAmount = Math.ceil(amount / rowSize)
          const possibleWidth = size.width / rowSize
          const possibleHeight = possibleWidth * 3 / 4

          const height = possibleHeight * columnsAmount > size.height
            ? size.height / columnsAmount
            : possibleHeight
          const width = height * 4 / 3

          return { height, width }
        })
        .reduce((r, x) => r.width * r.height > x.width * x.height ? r : x)
    }),
    amount: amountStore,
    containerSize
  }
}
