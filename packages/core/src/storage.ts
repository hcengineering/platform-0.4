//
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
//

import type { Class, Doc, Ref } from './classes'
import type { Tx } from './tx'

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type QuerySelector<T> = {
  $in?: T[]
  $like?: string
}

export type ObjQueryType<T> = T | QuerySelector<T>

export type DocumentQuery<T extends Doc> = {
  [P in keyof T]?: ObjQueryType<T[P]>
}

export interface Storage {
  findAll: <T extends Doc>(_class: Ref<Class<T>>, query: DocumentQuery<T>) => Promise<T[]>
  tx: (tx: Tx) => Promise<void>
}

export function checkLikeQuery (value: string, query: string): boolean {
  const regex = likeToRegExp(query)
  return regex.test(value)
}

export function likeToRegExp (value: string): RegExp {
  const likeSymbol = '*'
  const searchString = value.split(likeSymbol).join('.*')
  return new RegExp(`^${searchString}$`)
}
