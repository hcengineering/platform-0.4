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

import { SecurityOptions } from '@anticrm/server'
import cors from '@koa/cors'
import { createServer } from 'https'
import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import Router from 'koa-router'
import { createFileServer } from '@anticrm/services'

interface FileServer {
  shutdown: () => void
}

export function startFileServer (port: number, token: string, security: SecurityOptions): FileServer {
  const app = new Koa()
  const router = new Router()
  createFileServer(app, router, token)

  app.use(cors({ exposeHeaders: 'Set-Cookie', credentials: true }))
  app.use(bodyParser())
  app.use(router.routes()).use(router.allowedMethods())

  const callback = app.callback()

  const server = createServer(security, callback)
  server.listen(port, () => {
    console.log('Anticrm Platform File server is started at ', port)
  })
  return {
    shutdown: server.close.bind(server)
  }
}
