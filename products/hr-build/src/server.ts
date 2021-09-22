import { Accounts } from '@anticrm/accounts'
import { getMongoClient, shutdown } from '@anticrm/mongo'
import { SecurityOptions, Server, startServer } from '@anticrm/server'
import { newApp, newAuthServer, newFrontServer } from '@anticrm/services'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { cwd } from 'process'
import builder from './model'
import { createWorkspace, upgradeWorkspace } from '@anticrm/workspaces'

import { createServer } from 'https'

import dotenv from 'dotenv'

if (!existsSync('./config/config.env')) {
  console.error('Configuration is not specified')
  process.exit(1)
}

dotenv.config({ path: './config/config.env' })

const webHost = process.env.WEB_HOST ?? 'localhost' // A public available host name
const webPort = parseInt(process.env.WEB_PORT ?? '8080') // A public available host port

const appPort = parseInt(process.env.SERVER_PORT ?? '18080')

const appSecret = process.env.SERVER_SECRET ?? 'secret'

const dbUri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017'

const WORKSPACE = process.env.WORKSPACE ?? 'workspace'
const WORKSPACE_ORGANIZATION = process.env.WORKSPACE_ORGANIZATION ?? ''

const SECURITY_CERT_FILE = process.env.SECURITY_CERT_FILE ?? './cert.pem'
const SECURITY_KEY_FILE = process.env.SECURITY_KEY_FILE ?? './privkey.pem'
const SECURITY_CA_FILE = process.env.SECURITY_CA_FILE ?? './chain.pem'

process.on('exit', () => {
  void shutdown()
})

async function initWorkspace (): Promise<void> {
  const client = await getMongoClient(dbUri)
  const db = client.db('accounts')
  const accounts = new Accounts(db, 'workspace', 'account', {
    protocol: 'wss',
    server: 'localhost',
    port: 0,
    tokenSecret: ''
  })

  if ((await db.collections()).length === 0) {
    await accounts.initAccountDb()
  }

  if ((await accounts.findWorkspace(WORKSPACE)) === undefined) {
    console.log('Initialize DB model')
    await accounts.createWorkspace(WORKSPACE, WORKSPACE_ORGANIZATION)
    await createWorkspace(WORKSPACE, { mongoDBUri: dbUri, txes: builder.getTxes() })
  } else {
    console.log('Upgrading DB model')
    await upgradeWorkspace(WORKSPACE, { mongoDBUri: dbUri, txes: builder.getTxes() })
  }
}

async function start (): Promise<void> {
  // Upgrade create workspace
  await initWorkspace()

  const config: SecurityOptions = {
    cert: readFileSync(SECURITY_CERT_FILE).toString(),
    key: readFileSync(SECURITY_KEY_FILE).toString(),
    ca: existsSync(SECURITY_CA_FILE) ? readFileSync(SECURITY_CA_FILE).toString() : undefined
  }

  const s: Server = await startServer(undefined, appPort, appSecret, {
    logRequests: false,
    logTransactions: false,
    security: config
  })

  const { koa, router, logger } = newApp()

  const address = s.address().address
  const port = s.address().port

  const info = {
    protocol: 'wss',
    server: webHost, // <--- we put web host here, since it is one publicly available.
    port: port,
    tokenSecret: appSecret
  }

  const auth = await newAuthServer(dbUri, koa, router, info)
  const front = newFrontServer(koa, './web')

  koa.use(logger)
  koa.use(router.routes()).use(router.allowedMethods())

  const confDir = join(cwd(), 'web')
  console.log('writing configuration to', confDir)
  // Now we could write and env.js file
  writeFileSync(
    join(confDir, 'env.js'),
    `
    window.APP_ACCOUNTS_URL = 'https://${webHost}:${webPort}/auth'
  `,
    {}
  )

  const callback = koa.callback()

  const server = createServer(config, callback)
  server.listen(webPort, () => {
    console.log('Anticrm Platform Web server is started at ', webHost, webPort)
  })

  console.log('Anticrm Platform server is started at ', address, port)

  process.on('exit', () => {
    console.log('shutting down')
    server.close()
    s.shutdown()
    front.shutdown()
    auth.shutdown()
  })
}
start().catch((err) => console.log(err))
