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

import { Accounts, wrapCall } from '@anticrm/accounts'
import { getMongoClient } from '@anticrm/mongo'
import { Request, serialize } from '@anticrm/rpc'
import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import Router from 'koa-router'

/**
 * @public
 */
export interface AuthServer {
  shutdown: () => void
  accounts: Accounts
}

/**
 * @public
 */
export async function newAuthServer (dbUri: string, app: Koa, router: Router, serverToken: string): Promise<AuthServer> {
  const client = await getMongoClient(dbUri)

  const db = client.db('accounts')
  const accounts = new Accounts(db, 'workspace', 'account', serverToken)

  router.post('auth', '/auth', async (ctx: any) => {
    const request = ctx.request.body as unknown as Request<any>
    const response = await wrapCall(accounts, request)
    ctx.body = serialize(response)
    ctx.set('Content-Type', 'application/json')
    ctx.set('Content-Encoding', 'identity')
    console.log(response)
  })

  app.use(bodyParser())

  return {
    shutdown: () => {},
    accounts
  }
}
