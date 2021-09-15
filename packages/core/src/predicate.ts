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

import type { Doc } from './classes'
import { checkLikeQuery, nestedDotQueryCheck } from './query'

/**
 * @public
 */
export type Predicate = (docs: Doc[]) => Doc[]
type PredicateFactory = (pred: any, propertyKey: string | undefined) => Predicate

const predicates: Record<string, PredicateFactory> = {
  $in: (o: any, propertyKey: string | undefined): Predicate => {
    if (!Array.isArray(o)) {
      throw new Error('$in predicate requires array')
    }
    return (docs: Doc[]): Doc[] => {
      const result: Doc[] = []
      for (const doc of docs) {
        if (o.includes(propertyKey !== undefined ? (doc as any)[propertyKey] : doc)) result.push(doc)
      }
      return result
    }
  },

  $like: (query: string, propertyKey: string | undefined): Predicate => {
    return (docs: Doc[]): Doc[] => {
      const result: Doc[] = []
      for (const doc of docs) {
        const value = propertyKey !== undefined ? (doc as any)[propertyKey] : doc
        if (checkLikeQuery(value, query)) result.push(doc)
      }
      return result
    }
  },
  $ne: (query: any, propertyKey: string | undefined): Predicate => {
    return (docs: Doc[]): Doc[] => {
      const result: Doc[] = []
      for (const doc of docs) {
        const value = propertyKey !== undefined ? (doc as any)[propertyKey] : doc
        if (query !== value && (propertyKey === undefined || !nestedDotQueryCheck(propertyKey, doc, query))) {
          result.push(doc)
        }
      }
      return result
    }
  }
}

/**
 * @public
 */
export function isPredicate (o: Record<string, any>): boolean {
  const keys = Object.keys(o)
  return keys.length > 0 && keys.every((key) => key.startsWith('$'))
}

/**
 * @public
 */
export function createPredicates (o: Record<string, any>, propertyKey: string | undefined): Predicate[] {
  const keys = Object.keys(o)
  const result: Predicate[] = []
  for (const key of keys) {
    const factory = predicates[key]
    if (factory === undefined) throw new Error('unknown predicate: ' + keys[0])
    result.push(factory(o[key], propertyKey))
  }
  return result
}
