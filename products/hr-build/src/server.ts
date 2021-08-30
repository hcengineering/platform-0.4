import { Server, startServer } from '@anticrm/server'
import { newApp, newFrontServer, newAuthServer } from '@anticrm/services'
import { writeFileSync } from 'fs'
import { join } from 'path'
import { cwd } from 'process'

const webHost = process.env.WEB_HOST ?? 'localhost' // A public available host name
const webPort = parseInt(process.env.WEB_PORT ?? '8080') // A public available host port

const appPort = parseInt(process.env.SERVER_PORT ?? '18080')

const appSecret = process.env.SERVER_SECRET ?? 'secret'

const dbUri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017'

async function start (): Promise<void> {
  const s: Server = await startServer(
    undefined,
    appPort,
    appSecret,
    { logRequests: false, logTransactions: false }
  )

  const { koa, router, logger } = newApp()

  const address = s.address().address
  const port = s.address().port

  const info = {
    server: webHost, // <--- we put web host here, since it is one publicly available.
    port: port,
    tokenSecret: appSecret
  }

  const auth = await newAuthServer(dbUri, koa, router, info)
  const front = newFrontServer(koa, './dist')

  koa.use(logger)
  koa.use(router.routes()).use(router.allowedMethods())

  const confDir = join(cwd(), 'dist')
  console.log('writing configuration to', confDir)
  // Now we could write and env.js file
  writeFileSync(join(confDir, 'env.js'), `
    window.APP_ACCOUNTS_URL = 'http://${webHost}:${webPort}/auth'
  `, {})

  const server = koa.listen(webPort, () => {
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
