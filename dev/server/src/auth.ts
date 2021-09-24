import { Accounts, ServerInfo, wrapCall } from '@anticrm/accounts'
import { Request, serialize } from '@anticrm/rpc'
import { SecurityOptions } from '@anticrm/server'
import cors from '@koa/cors'
import { createServer } from 'https'
import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import Router from 'koa-router'
import { Db } from 'mongodb'

interface AuthServer {
  shutdown: () => void
  accounts: Accounts
}

export function newAuthServer (port: number, db: Db, serverInfo: ServerInfo, security: SecurityOptions): AuthServer {
  const app = new Koa()
  const router = new Router()

  const accounts = new Accounts(db, 'workspace', 'account', serverInfo)

  router.post('rpc', '/rpc', async (ctx: any) => {
    const request = ctx.request.body as unknown as Request<any>
    const response = await wrapCall(accounts, request)
    ctx.body = serialize(response)
    console.log(response)
  })

  app.use(cors())
  app.use(bodyParser())
  app.use(router.routes()).use(router.allowedMethods())

  const callback = app.callback()

  const server = createServer(security, callback)
  server.listen(port, () => {
    console.log('Anticrm Platform Web server is started at ', port)
  })
  return {
    shutdown: server.close.bind(server),
    accounts
  }
}
