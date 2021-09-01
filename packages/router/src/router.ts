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

import { deepEqual } from 'fast-equals'
import { ApplicationRouter, VariableType } from '.'
import { Location, newLocation, QueryType } from '.'
import { matchLocation, parsePattern, RoutePattern } from './routePattern'

/**
 * @public
 */
export type Matcher<P> = (match: P) => void
/**
 * @public
 * Define an one route with matcher inside router.
 */
export interface Route<T> {
  patternText: string
  defaults: T
  matcher: Matcher<T>
}

interface Route2<T> extends Route<T> {
  variables: T
  pattern: RoutePattern
}

class RouteRouter<T, P> implements ApplicationRouter<P> {
  constructor (readonly parent: Router<T>, readonly setRoute: () => void) {}

  addRoute<P>(patternText: string, matcher: (match: P) => void, defaults: P): ApplicationRouter<P> {
    return this.parent.addRoute<P>(patternText, matcher, defaults)
  }

  navigate (values: P): void {
    this.setRoute()
    return this.parent.navigateRaw(values as unknown as T)
  }

  location (values: P): Location {
    this.setRoute()
    return this.parent.locationRaw(values as unknown as T)
  }
}

/**
 * @public
 */
export class Router<T> implements ApplicationRouter<T> {
  private readonly topRouter: Router<VariableType>
  private childRouter: Router<any> | undefined

  private readonly routes: Route2<any>[] = []
  private current: Route2<any> | undefined

  private childLocation: Location | undefined

  constructor (
    readonly route: Route<T>,
    topRouter?: Router<VariableType>,
    private readonly doNavigate?: (newLoc: Location) => void
  ) {
    this.topRouter = topRouter ?? (this as Router<VariableType>)
    this.routes.push({ ...route, pattern: parsePattern(route.patternText), variables: route.defaults })
  }

  addRoute<P>(patternText: string, matcher: Matcher<P>, defaults: P): ApplicationRouter<P> {
    const r = { patternText, pattern: parsePattern(patternText), matcher, defaults, variables: defaults }
    this.routes.push(r)
    return new RouteRouter(this, () => {
      this.selectRoute(r)
    })
  }

  navigate (values: T): void {
    this.selectRoute(this.routes[0])
    this.navigateRaw(values)
  }

  navigateRaw (values: T): void {
    const loc = this.locationRaw(values)
    this.doNavigate?.(loc)
  }

  /**
   * Will received new location
   */
  update (loc: Location, forceUpdate = false): void {
    for (const route of this.routes) {
      const { childLocation, variables, matched } = matchLocation(route.pattern, loc, route.defaults)
      if (matched) {
        this.processMatchedRoute(route, variables, forceUpdate, childLocation)
        return
      }
    }

    // TODO: Add others, match processor
  }

  assigneeConverter = {
    boolean: (v: any) => v === null || v === 'true',
    number: (v: any) => (v === null ? 0 : parseInt(v)),
    default: (v: any) => v
  }

  private processMatchedRoute (
    route: Route2<any>,
    variables: QueryType,
    forceUpdate: boolean,
    childLocation: Location
  ): void {
    this.current = route
    const oldVars = route.variables
    const newVariables = this.assignVariables<any>(route, variables)

    if (this.childLocation === undefined || !deepEqual(oldVars, newVariables) || forceUpdate) {
      route.variables = newVariables
      route.matcher(route.variables)
    }

    this.childRouter?.update(childLocation)
    this.childLocation = childLocation
  }

  private assignVariables<P>(route: Route<P>, variables: QueryType): P {
    const result: VariableType = { ...route.defaults }
    // go over defaults and covert types if applicable
    for (const [k, v] of Object.entries(variables)) {
      const dv = result[k]
      const cv = (this.assigneeConverter as any)[typeof dv] ?? this.assigneeConverter.default
      const vv = cv(v)
      if (vv !== undefined) {
        result[k] = vv
      }
    }
    return result as unknown as P
  }

  newRouter<P>(patternText: string, matcher: (match: P) => void, defaults: P): Router<P> {
    this.childRouter = new Router<P>({ patternText, matcher, defaults }, this.topRouter, this.doNavigate)
    if (this.childLocation !== undefined) {
      this.childRouter?.update(this.childLocation)
    }
    return this.childRouter
  }

  properties (): T | undefined {
    return this.current?.variables as unknown as T
  }

  private buildPath (route: Route2<any>, vars: QueryType): string[] {
    return route.pattern.segments.map((s) => (s.startsWith(':') ? vars[s.substring(1)] ?? '' : s))
  }

  /**
   * Join values, leaf values are more important.
   */
  private buildQuery (route: Route2<any>, query: QueryType | undefined, vars: QueryType): QueryType | undefined {
    for (const qName of route.pattern.queryNames) {
      const val = vars[qName]
      if (val !== undefined) {
        query = query ?? {}
        query[qName] = val
      }
    }
    return query
  }

  /**
   * Return leaf fragment first and upwards
   */
  private buildFragment (route: Route2<any>, vars: QueryType): string | undefined {
    return route.pattern.fragmentName !== '' ? vars[route.pattern.fragmentName] ?? undefined : undefined
  }

  location (values: T): Location {
    this.selectRoute(this.routes[0])
    return this.locationRaw(values)
  }

  locationRaw (values: T): Location {
    const routers = this.routers()
    const result = newLocation()
    for (const r of routers) {
      const route = r.current ?? r.routes[0] // Select default route if not matched
      const newVars = { ...route.variables, ...values } // Make variables for particular router.

      // Build path
      result.path = [...result.path, ...r.buildPath(route, newVars)]

      // Build query
      result.query = r.buildQuery(route, result.query, newVars)

      result.fragment = result.fragment ?? r.buildFragment(route, newVars)
    }
    return result
  }

  private selectRoute<P>(route: Route2<P>): void {
    if (this.current?.patternText !== route.patternText) {
      this.current = route
      this.current.variables = {}
    }
  }

  private routers (): Array<Router<any>> {
    const result: Router<QueryType>[] = []
    let item: Router<QueryType> | undefined = this.topRouter
    while (item !== undefined) {
      result.push(item)
      item = item.childRouter
    }
    return result
  }

  clearChildRouter (): void {
    this.childRouter = undefined
  }
}
