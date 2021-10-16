//
// Copyright © 2020, 2021 Anticrm Platform Contributors.
// Copyright © 2021 Hardcore Engineering Inc.
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
//

import copy from 'fast-copy'
import type { Doc, PropertyType } from './classes'
import { createPredicates, isPredicate } from './predicate'

/**
 * @public
 */
export type OperatorFunc = (doc: Doc, op: object) => void

function $push (document: Doc, keyval: Record<string, PropertyType>): void {
  const doc = document as any
  for (const key in keyval) {
    let pushed: any[] = []
    if (keyval[key].$each !== undefined) {
      for (const item of keyval[key].$each) {
        pushed.push(item)
      }
    } else {
      pushed = [keyval[key]]
    }
    const arr: Array<any> = doc[key]
    if (arr === undefined) {
      doc[key] = pushed
    } else {
      arr.push(...pushed)
    }
  }
}

function matchDoc (pulled: any[], value: any): boolean {
  for (const p of pulled) {
    if (p === value) {
      return true
    }
    if (typeof p === 'object' && typeof value === 'object') {
      // We need to match inner fields of p to match same fields in value
      for (const [k, v] of Object.entries(p)) {
        if (value[k] !== v) {
          return false
        }
      }
      // All fields of p are matched fiels in v.
      return true
    }
  }
  return false
}
function $pull (document: Doc, keyval: Record<string, PropertyType>): void {
  const doc = document as any
  for (const key in keyval) {
    const arr: Array<any> = doc[key]
    if (arr !== undefined) {
      let pulled: any[] = []
      if (isPredicate(keyval[key])) {
        const preds = createPredicates(keyval[key], '')
        let temp = copy(arr)
        for (const pred of preds) {
          temp = pred(temp)
        }
        pulled = temp
      } else {
        pulled = [keyval[key]]
      }
      doc[key] = arr.filter((k) => !matchDoc(pulled, k))
    }
  }
}

const operators: Record<string, OperatorFunc> = {
  $push,
  $pull
}

/**
 * @public
 */
export function getOperator (name: string): OperatorFunc {
  const operator = operators[name]
  if (operator === undefined) throw new Error('unknown operator: ' + name)
  return operator
}
