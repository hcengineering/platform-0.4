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
import { assignWorkspace, decodeToken, WorkspaceInfo } from '@anticrm/server'
import { Account, generateId, Ref, Space } from '@anticrm/core'
import Koa, { Context } from 'koa'
import bodyParser from 'koa-bodyparser'
import Router from 'koa-router'

const storages: Map<string, S3Storage> = new Map<string, S3Storage>()
const workspaces: Map<Ref<Account>, WorkspaceInfo> = new Map<Ref<Account>, WorkspaceInfo>()

/**
 * @public
 */
export interface FileServer {
  shutdown: () => void
}

/**
 * @public
 */
export function createFileServer (
  app: Koa,
  router: Router,
  tokenSecret: string,
  uri: string,
  accessKey: string,
  secret: string,
  ca?: string
): FileServer {
  router.post('/file', async (ctx: Context) => {
    const token = (ctx.header.token ?? '') as string
    const expires = new Date(new Date().setFullYear(new Date().getFullYear() + 1))
    ctx.cookies.set('token', token, { sameSite: 'none', secure: true, httpOnly: true, expires: expires })
    ctx.status = 200
  })

  router.put('/file', async (ctx: Context) => {
    const request = ctx.request.body
    const space = request.space as Ref<Space>
    const key = request.key as string
    const workspaceId = await checkSecurity(ctx, space, tokenSecret)
    if (workspaceId === undefined) return
    console.info('Contacting S3 at ', uri)
    const storage = await getStorage(workspaceId, uri, accessKey, secret, ca)
    const link = await storage.getUploadLink(space + key, request.type)
    console.info('S3 upload link at ', link)
    ctx.status = 200
    ctx.set('Content-Type', 'text/plain')
    ctx.set('Content-Encoding', 'identity')
    ctx.body = link
  })

  router.delete('/file', async (ctx: Context) => {
    const request = ctx.request.body
    const space = request.space as Ref<Space>
    const key = request.key as string
    const workspaceId = await checkSecurity(ctx, space, tokenSecret)
    if (workspaceId === undefined) return
    const storage = await getStorage(workspaceId, uri, accessKey, secret, ca)
    await storage.remove(space + key)
    ctx.status = 200
  })

  router.get('/file/:spaceId/:key/:fileName', async (ctx: Context) => {
    const space = ctx.params.spaceId as Ref<Space>
    const key = ctx.params.key as string
    const fileName = ctx.params.fileName as string
    const width = Number(ctx.query.width as string)
    const workspaceId = await checkSecurity(ctx, space, tokenSecret)
    if (workspaceId === undefined) return
    const storage = await getStorage(workspaceId, uri, accessKey, secret, ca)
    if (!isNaN(width)) {
      const file = await storage.getImage(space + key, width)
      if (file !== undefined) {
        ctx.status = 200
        if (file.type !== undefined) {
          ctx.set('Content-Type', file.type)
        }
        ctx.body = file.body
      } else {
        ctx.status = 404
        ctx.body = 'Not found'
      }
      return
    }
    const link = await storage.getDownloadLink(space + key, fileName)
    ctx.redirect(link)
  })

  app.use(bodyParser())

  return {
    shutdown: () => {}
  }
}

async function checkSecurity (ctx: Context, space: Ref<Space>, tokenSecret: string): Promise<string | undefined> {
  const token = ctx.cookies.get('token')
  if (token === undefined) {
    ctx.status = 401
    ctx.body = 'Unauthorized'
    return undefined
  }
  const { accountId, workspaceId } = decodeToken(tokenSecret, token)
  const allowed = await checkSpaceSecurity(accountId, workspaceId, space)
  if (!allowed) {
    ctx.status = 401
    ctx.body = 'Unauthorized'
    return undefined
  }
  return workspaceId
}

async function checkSpaceSecurity (accountId: Ref<Account>, workspaceId: string, space: Ref<Space>): Promise<boolean> {
  let currentWorkspace = workspaces.get(accountId)
  if (currentWorkspace === undefined) {
    const clientId = generateId()
    const { workspace } = await assignWorkspace({ clientId, accountId, workspaceId, tx: () => {} })
    workspaces.set(accountId, workspace)
    currentWorkspace = workspace
  }
  const allowed = currentWorkspace.security.getUserSpaces(accountId)
  return allowed.has(space)
}

async function getStorage (
  workspaceId: string,
  uri: string,
  accessKey: string,
  secret: string,
  ca?: string
): Promise<S3Storage> {
  let storage = storages.get(workspaceId)
  if (storage === undefined) {
    storage = await S3Storage.create(accessKey, secret, uri, workspaceId, ca)
    storages.set(workspaceId, storage)
  }
  return storage
}
