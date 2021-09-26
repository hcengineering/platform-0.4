//
// Copyright © 2021 Anticrm Platform Contributors.
//
// Licensed under the Eclipse Public License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License. You may
// obtain a copy of the License at https://www.eclipse.org/legal/epl-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//
// See the License for the specific language governing permissions and
// limitations under the License.
//
import { S3Storage } from '@anticrm/s3'
import { assignWorkspace, decodeToken } from '@anticrm/server'
import { Account, generateId, Ref, Space } from '@anticrm/core'
import Koa, { Context } from 'koa'
import bodyParser from 'koa-bodyparser'
import Router from 'koa-router'

const S3_URI = process.env.S3_URI ?? 'http://127.0.0.1:9000'
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY ?? 'minio'
const S3_SECRET = process.env.S3_SECRET ?? 'miniosecret'

const storages: Map<string, S3Storage> = new Map<string, S3Storage>()

/**
 * @public
 */
export interface FileServer {
  shutdown: () => void
}

/**
 * @public
 */
export function newFileServer (app: Koa, router: Router, tokenSecret: string): FileServer {
  router.post('/file', async (ctx: Context) => {
    const token = (ctx.header.token ?? '') as string
    const expires = new Date(new Date().setFullYear(new Date().getFullYear() + 1))
    ctx.cookies.set('token', token, { sameSite: 'none', secure: true, httpOnly: false, expires: expires })
    ctx.status = 200
  })

  router.put('/file', async (ctx: Context) => {
    const token = (ctx.header.token ?? '') as string
    if (token === undefined) {
      ctx.status = 401
      ctx.body = 'Unauthorized'
      return
    }
    const { accountId, workspaceId } = decodeToken(tokenSecret, token)
    const request = ctx.request.body
    const allowed = await checkSecurity(accountId, workspaceId, request.space)
    if (!allowed) {
      ctx.status = 401
      ctx.body = 'Unauthorized'
      return
    }
    const storage = await getStorage(workspaceId)
    const link = await storage.getUploadLink(request.key, request.type)
    ctx.status = 200
    ctx.body = link
  })

  router.delete('/file', async (ctx: Context) => {
    const token = (ctx.header.token ?? '') as string
    if (token === undefined) {
      ctx.status = 401
      ctx.body = 'Unauthorized'
      return
    }
    const { accountId, workspaceId } = decodeToken(tokenSecret, token)
    const request = ctx.request.body
    const allowed = await checkSecurity(accountId, workspaceId, request.space)
    if (!allowed) {
      ctx.status = 401
      ctx.body = 'Unauthorized'
      return
    }
    const storage = await getStorage(workspaceId)
    await storage.remove(request.key)
    ctx.status = 200
  })

  router.get('/file/:spaceId/:key/:fileName', async (ctx: Context) => {
    const space = ctx.params.spaceId
    const key = ctx.params.key
    const fileName = ctx.params.fileName
    const token = ctx.cookies.get('token')
    if (token === undefined) {
      ctx.status = 401
      ctx.body = 'Unauthorized'
      return
    }
    const { accountId, workspaceId } = decodeToken(tokenSecret, token)
    const allowed = await checkSecurity(accountId, workspaceId, space)
    if (!allowed) {
      ctx.status = 401
      ctx.body = 'Unauthorized'
      return
    }
    const storage = await getStorage('workspace')
    const link = await storage.getDownloadLink(key, fileName)
    // ctx.status = 301
    ctx.redirect(link)
  })

  app.use(bodyParser())

  return {
    shutdown: () => {}
  }
}

async function checkSecurity (accountId: Ref<Account>, workspaceId: string, space: Ref<Space>): Promise<boolean> {
  const clientId = generateId()
  const { workspace } = await assignWorkspace({ clientId, accountId, workspaceId, tx: () => {} })
  const allowed = workspace.security.getUserSpaces(accountId)
  return allowed.has(space)
}

async function getStorage (workspaceId: string): Promise<S3Storage> {
  let storage = storages.get(workspaceId)
  if (storage === undefined) {
    storage = await S3Storage.create(S3_ACCESS_KEY, S3_SECRET, S3_URI, workspaceId)
    storages.set(workspaceId, storage)
  }
  return storage
}
