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
        if (o.includes((doc as any)[propertyKey]) === true) 
          result.push(doc)
      }
      return result
    }
  }
}

export function isPredicate(o: Record<string, any>) {
  const keys = Object.keys(o)
  return keys.length === 1 && keys[0].startsWith('$')
}

export function createPredicate(o: Record<string, any>, propertyKey: string): Predicate {
  const keys = Object.keys(o)
  const factory = predicates[keys[0]]
  if (factory === undefined)
    throw new Error('unknown predicate: ' + keys[0])
  return factory(o[keys[0]], propertyKey)
}
