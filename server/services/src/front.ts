//
// Copyright © 2020, 2021 Anticrm Platform Contributors.
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

// import cors from '@koa/cors'
import Koa from 'koa'
import send from 'koa-send'
import serve from 'koa-static'

/**
 * @public
 */
export interface FrontServer {
  shutdown: () => void
}

/**
 * @public
 */
export function newFrontServer (app: Koa, hostDir: string): FrontServer {
  app.use(serve(hostDir))

  app.use(async function (ctx, next) {
    console.log('handle send index.html')
    return await send(ctx, '/index.html', { root: hostDir }).then(async () => await next())
  })

  return {
    shutdown: () => {}
  }
}
