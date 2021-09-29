import Koa from 'koa'
import Router from 'koa-router'
import logger from 'koa-logger'

export * from './auth'
export * from './front'
export * from './fileServer'

/**
 * @public
 */
export function newApp (): { koa: Koa, router: Router, logger: Koa.Middleware } {
  return { koa: new Koa(), router: new Router(), logger: logger() }
}
