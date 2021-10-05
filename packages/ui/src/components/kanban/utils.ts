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

export interface State {
  left: boolean
  top: boolean
  right: boolean
  bottom: boolean
}

export function getHoverState (node: HTMLElement, x: number, y: number): State {
  const { top, left, width, height } = node.getBoundingClientRect()
  const right = left + width
  const hHalf = left + width / 2
  const bottom = top + height
  const vHalf = top + height / 2

  return {
    left: x >= left && x < hHalf,
    right: x >= hHalf && x <= right,
    top: y >= top && y < vHalf,
    bottom: y >= vHalf && y <= bottom
  }
}
