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

/**
 * @public
 */
export type QuerySelector<T> /* eslint-disable-line @typescript-eslint/consistent-type-definitions */ = {
  $in?: T[]
  $like?: string
  $ne?: T
  $exists?: boolean
  $gte?: T
  $gt?: T
  $lte?: T
  $lt?: T
}

/**
 * @public
 */
export type ObjQueryType<T> = T | QuerySelector<T>

/**
 * @public
 */
export interface RootQueryFilter<T extends Doc> {
  // Perform logical or operation.
  $or?: DocumentQuery<T>[]
  // support nested queries e.g. 'user.friends.name'
  // this will mark all unrecognized properties as any (including nested queries)
  [key: string]: any
}

/**
 * @public
 */
export type DocumentQuery<T extends Doc> = {
  [P in keyof T]?: ObjQueryType<T[P]>
} & RootQueryFilter<T>

/**
 * @public
 */
export type FindOptions<T extends Doc> /* eslint-disable-line @typescript-eslint/consistent-type-definitions */ = {
  limit?: number
  skip?: number
  sort?: SortingQuery<T>
}

/**
 * @public
 */
export type SortingQuery<T extends Doc> = {
  [P in keyof T]?: T[P] extends object ? never : SortingOrder
}

/**
 * @public
 */
export enum SortingOrder {
  Ascending = 1,
  Descending = -1
}

/**
 * @public
 */
export interface FindResult<T extends Doc> extends Array<T> {
  total: number
}

/**
 * @public
 */
export interface Storage {
  findAll: <T extends Doc>(
    _class: Ref<Class<T>>,
    query: DocumentQuery<T>,
    options?: FindOptions<T>
  ) => Promise<FindResult<T>>
  tx: (tx: Tx) => Promise<void>
}
