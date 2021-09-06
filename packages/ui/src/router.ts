import { ApplicationRouter, QueryType, Router, Location, Matcher } from '@anticrm/router'
import { getContext, onDestroy, setContext } from 'svelte'
import { navigate, location } from './location'
const CONTEXT_ROUTE_VALUE = 'routes.context'

export interface PlatformRouterParams {
  routerPrefix?: string
}

export const PlatformRouterKey = 'PlatformRouter'

const navigateOp = (loc: Location): void => {
  navigate(loc)
}

/**
 * @public
 */
export function newRouter<T> (pattern: string, matcher: Matcher<T>, defaults: T): ApplicationRouter<T> {
  const r: Router<QueryType> = getContext(CONTEXT_ROUTE_VALUE)
  let result: Router<T>

  if (r !== undefined) {
    result = r.newRouter<T>(pattern, matcher, defaults)
    // We need to remove child router from parent, if component is destroyed
    onDestroy(() => r.clearChildRouter())
  } else {
    pattern = checkPatternPrefix(pattern)
    result = new Router<T>({ patternText: pattern, matcher, defaults }, r, navigateOp)
    // No parent, we need to subscribe for location changes.
    subscribeLocation<T>(result)
  }
  setContext(CONTEXT_ROUTE_VALUE, result)
  return result
}

function subscribeLocation<T> (result: Router<T>): void {
  const unsubscribe = location.subscribe((loc) => {
    result.update(loc)
  })
  onDestroy(() => {
    unsubscribe?.()
  })
}

function checkPatternPrefix (pattern: string): string {
  const prefix = ((window as any)[PlatformRouterKey] as PlatformRouterParams).routerPrefix
  if (prefix !== undefined) {
    pattern = prefix + pattern
  }
  return pattern
}

/**
 * @public
 */
export function getRouter<T> (): ApplicationRouter<T> {
  const router = getContext(CONTEXT_ROUTE_VALUE)
  if (router === undefined) {
    throw new Error('No application router defined')
  }
  return router as ApplicationRouter<T>
}
