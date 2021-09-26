import { Accounts } from '@anticrm/accounts'
import { SecurityOptions } from '@anticrm/server'
import { newAuthServer } from '@anticrm/services'
import cors from '@koa/cors'
import { createServer } from 'https'
import Koa from 'koa'
import Router from 'koa-router'
import logger from 'koa-logger'

interface AuthServer {
  shutdown: () => void
  accounts: Accounts
}

export async function startAuthServer (
  port: number,
  dbUri: string,
  serverToken: string,
  security: SecurityOptions
): Promise<AuthServer> {
  const app = new Koa()
  const router = new Router()

  const authServer = await newAuthServer(dbUri, app, router, serverToken)

  app.use(cors())
  app.use(logger())
  app.use(router.routes()).use(router.allowedMethods())

  const callback = app.callback()

  const server = createServer(security, callback)
  server.listen(port, () => {
    console.log('Anticrm Platform Auth server is started at ', port)
  })
  return {
    shutdown: () => {
      server.close()
      authServer.shutdown()
    },
    accounts: authServer.accounts
  }
}
