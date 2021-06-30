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

type Predicate = (docs: Doc[]) => Doc[]
type PredicateFactory = (pred: any, propertyKey: string) => Predicate

const predicates: Record<string, PredicateFactory> = {
  $in: (o: any, propertyKey: string): Predicate => {
    if (!Array.isArray(o)) {
      throw new Error('$in predicate requires array')
    }
    return (docs: Doc[]): Doc[] => {
      const result: Doc[] = []
      for (const doc of docs) {
        if (o.includes((doc as any)[propertyKey])) result.push(doc)
      }
      return result
    }
  },

  $like: (query: string, propertyKey: string): Predicate => {
    const likeSymbol = '*'
    return (docs: Doc[]): Doc[] => {
      const result: Doc[] = []
      for (const doc of docs) {
        const value = (doc as any)[propertyKey] as string
        const searchValues = query.split(likeSymbol)
        let isSuccess = true
        let startIndex = 0
        for (const searchValue of searchValues) {
          const index = value.indexOf(searchValue, startIndex)
          if (index === -1 || (searchValues[0] !== '' && index > 0 && startIndex === 0)) {
            isSuccess = false
            break
          }
          startIndex = index + searchValue.length
        }
        if (isSuccess) result.push(doc)
      }
      return result
    }
  }
}

export function isPredicate (o: Record<string, any>): boolean {
  const keys = Object.keys(o)
  return keys.every(key => key.startsWith('$'))
}

export function createPredicates (o: Record<string, any>, propertyKey: string): Predicate[] {
  const keys = Object.keys(o)
  const result: Predicate[] = []
  for (const key of keys) {
    const factory = predicates[key]
    if (factory === undefined) throw new Error('unknown predicate: ' + keys[0])
    result.push(factory(o[key], propertyKey))
  }
  return result
}
