//
// Copyright © 2020, 2021 Anticrm Platform Contributors.
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

/**
 * @public
 */
export type QueryType = Record<string, string|null>

/**
 * Describe a browser URI location parsed to path, query and fragment.
 * @public
 */
export interface Location {
  path: string[] // A useful path value
  query?: QueryType // a value of query parameters, no duplication are supported
  fragment?: string // a value of fragment
}

/**
 * @public
 */
export function newLocation (): Location {
  return { path: [], query: undefined, fragment: undefined }
}


/**
 * @public
 */
export type VariableType = Record<string, any>

/**
 * Could be registered to provide platform a way to decide about routes from Root component.
 * @public
 */
export interface ApplicationRouter<T> {
  /**
   * Construct a full new location based on values of T, could apply values to any router in tier chain.
   * Other values will be taken from stored parent and child routers.
   *
   * if some of router is not matched, then it will be skipped.
   */
  location: (values: T) => Location

  /**
   * Use new constructed location value and platform UI to navigate.
   */
  navigate: (values: T) => void

  /**
   * Add a new route to router.
   */
  addRoute: <P>(patternText: string, matcher: (match: P) => void, defaults: P) => ApplicationRouter<P>
}

export * from './location'
export { Matcher, Route, Router } from './router'

