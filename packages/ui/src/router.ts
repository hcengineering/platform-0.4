import { ApplicationRouter, QueryType, Router, Location } from '@anticrm/router'
import { getContext, onDestroy, setContext } from 'svelte'
import { navigate, location } from './location'
const CONTEXT_ROUTE_VALUE = 'routes.context'

/**
 * @public
 */
export function newRouter<T> (pattern: string, matcher: (match: T) => void, defaults: T): ApplicationRouter<T> {
  const r: Router<QueryType> = getContext(CONTEXT_ROUTE_VALUE)
  const navigateOp = (loc: Location): void => {
    navigate(loc)
  }
  const result =
    r !== undefined
      ? r.newRouter<T>(pattern, matcher, defaults)
      : new Router<T>({ patternText: pattern, matcher, defaults }, r, navigateOp)

  if (r === undefined) {
    // No parent, we need to subscribe for location changes.
    const unsubscribe = location.subscribe((loc) => {
      result.update(loc)
    })
    onDestroy(() => {
      unsubscribe?.()
    })
  }
  if (r !== undefined) {
    // We need to remove child router from parent, if component is destroyed
    onDestroy(() => r.clearChildRouter())
  }
  setContext(CONTEXT_ROUTE_VALUE, result)
  return result
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
