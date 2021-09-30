import { Accounts } from '@anticrm/accounts'
import { getMongoClient, shutdown } from '@anticrm/mongo'
import { Server, startServer } from '@anticrm/server'
import { newApp, newAuthServer, createFileServer, newFrontServer } from '@anticrm/services'
import { createWorkspace, upgradeWorkspace } from '@anticrm/workspaces'
import { createServer } from 'https'
import { config, readCertificates } from './config'
import builder from './model'

async function initWorkspace (): Promise<void> {
  const client = await getMongoClient(config.dbUri)
  const db = client.db('accounts')
  const accounts = new Accounts(db, 'workspace', 'account', config.appSecret)

  if ((await db.collections()).length === 0) {
    await accounts.initAccountDb()
  }

  if ((await accounts.findWorkspace(config.workspace)) === undefined) {
    console.log('Initialize DB model')
    await accounts.createWorkspace(config.workspace, config.organization)
    await createWorkspace(config.workspace, { mongoDBUri: config.dbUri, txes: builder.getTxes() })
  } else {
    console.log('Upgrading DB model')
    await upgradeWorkspace(config.workspace, { mongoDBUri: config.dbUri, txes: builder.getTxes() })
  }
}

async function start (): Promise<void> {
  console.log('starting Anticrm Server')
  console.info('Anticrm HR build configuration:', JSON.stringify(config, undefined, 2))

  console.info('Anticrm HR build ENV:', JSON.stringify(process.env, undefined, 2))

  // Upgrade create workspace
  await initWorkspace()

  const security = readCertificates()

  const appServer: Server = await startServer(undefined, config.appPort, config.appSecret, {
    logRequests: false,
    logTransactions: false,
    security
  })

  const { koa, router, logger } = newApp()

  const address = appServer.address().address
  const port = appServer.address().port

  const auth = await newAuthServer(config.dbUri, koa, router, config.appSecret)
  const file = createFileServer(koa, router, config.appSecret, config.s3Uri, config.s3AccessKey, config.s3Secret)
  const front = newFrontServer(koa, './web')

  // Handle client information loading
  router.get('env.json', '/env.json', async (ctx: any) => {
    ctx.set('Content-Type', 'application/json')
    ctx.set('Content-Encoding', 'identity')
    ctx.body = JSON.stringify(config.platform, undefined, 2)
  })

  koa.use(logger)
  koa.use(router.routes()).use(router.allowedMethods())

  const callback = koa.callback()

  console.log('Anticrm Platform Web server config ', config.webHost, config.webPort)
  const webServer = createServer(security, callback)
  webServer.listen(config.webPort, () => {
    console.log('Anticrm Platform Web server is started at ', config.webHost, config.webPort)
  })

  console.log('Anticrm Platform server is started at ', address, port)

  const doShutdown = (): void => {
    console.log('shutting down')
    webServer.close()
    appServer.shutdown()
    front.shutdown()
    file.shutdown()
    auth.shutdown()
    void shutdown().then(process.exit(0))
  }

  process.on('exit', doShutdown)
  process.on('SIGINT', doShutdown)
  process.on('SIGTERM', doShutdown)
}

start().catch((err) => console.log(err))
