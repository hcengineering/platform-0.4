//
// Copyright © 2020 Anticrm Platform Contributors.
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

/* eslint-env jest */

import { Request } from '@anticrm/rpc'
import { Collection, Db, MongoClient, MongoClientOptions } from 'mongodb'
import { AccountDetails, AccountInfo, Accounts, Code, wrapCall } from '..'

const DB_NAME = 'test_accounts'

describe('server', () => {
  const dbUri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017'
  let conn: MongoClient
  let db: Db
  let accounts: Accounts

  beforeAll(async () => {
    const options: MongoClientOptions = { useUnifiedTopology: true }
    conn = await MongoClient.connect(dbUri, options)
    db = conn.db(DB_NAME)
    await db.dropDatabase()
    accounts = new Accounts(conn.db(DB_NAME), 'workspace', 'account', {
      protocol: 'ws',
      server: 'localhost',
      port: 18180,
      tokenSecret: 'secret'
    })
  })

  const workspace = (): Collection => db.collection('workspace')
  const account = (): Collection => db.collection('account')

  beforeEach(async () => {
    try {
      await account().drop()
    } catch (err) {}
    try {
      await workspace().drop()
    } catch (err) {}

    await accounts.initAccountDb()
  })

  afterAll(async () => {
    await conn.close()
  })

  it('should create workspace', async () => {
    const request: Request<[string, string]> = { method: 'createWorkspace', params: ['workspace', 'OOO Horse Inc'] }

    const result = await wrapCall(accounts, request)
    expect(result.result).toBeDefined()

    const ws = await workspace().find({}).toArray()
    expect(ws.length).toEqual(1)

    const ws2 = await accounts.findWorkspace('workspace')
    expect(ws2).toBeDefined()
  })

  it('should not create duplicate workspace', async () => {
    const request: Request<[string, string]> = { method: 'createWorkspace', params: ['workspace', 'OOO Horse Inc'] }

    await workspace().insertOne({ workspace: 'workspace', organisation: 'Bull Inc', accounts: [] })

    const result = await wrapCall(accounts, request)
    expect(result.error).toBeDefined()
  })

  it('should create account', async () => {
    const request: Request<[string, string]> = { method: 'createAccount', params: ['andrey2', '123'] }

    const result = await wrapCall(accounts, request)
    expect(result.result).toBeDefined()

    expect(accounts.findAccount('andrey2')).toBeDefined()
  })

  it('should signup', async () => {
    await workspace().insertOne({ workspace: 'workspace', organisation: 'Bull Inc', accounts: [] })
    const request: Request<[string, string, string, AccountDetails]> = {
      method: 'signup',
      params: ['andrey2', '123', 'workspace', { firstName: 'N1', lastName: 'N2' }]
    }

    const result = await wrapCall(accounts, request)
    expect(result.result).toBeDefined()

    expect(accounts.findAccount('andrey2')).toBeDefined()
  })

  it('should not create account', async () => {
    const request: Request<[string, string]> = { method: 'createAccount', params: ['', '123'] }

    const result = await wrapCall(accounts, request)
    expect(result.result).toBeUndefined()
    expect(result.error).toBeDefined()
  })

  it('should not create duplicate account', async () => {
    await account().insertOne({ email: 'andrey2', workspaces: [] })

    const request: Request<[string, string]> = { method: 'createAccount', params: ['andrey2', '123'] }
    const result = await wrapCall(accounts, request)
    expect(result.error).toBeDefined()
  })

  it('should add workspace', async () => {
    await account().insertOne({ email: 'andrey2', workspaces: [] })
    await wrapCall(accounts, { method: 'createWorkspace', params: ['workspace', 'OOO Horse Inc'] })

    const request: Request<[string, string]> = { method: 'addWorkspace', params: ['andrey2', 'workspace'] }

    const result = await wrapCall(accounts, request)
    expect(result.error).toBeUndefined()
  })

  it('should login', async () => {
    // Prepare account.
    await wrapCall(accounts, { method: 'createAccount', params: ['andrey2', '123'] })
    await wrapCall(accounts, { method: 'createWorkspace', params: ['workspace', 'OOO Horse Inc'] })
    await wrapCall(accounts, { method: 'addWorkspace', params: ['andrey2', 'workspace'] })

    const request: Request<[string, string, string]> = {
      method: 'login',
      params: ['andrey2', '123', 'workspace']
    }

    const result = await wrapCall<any[], AccountInfo>(accounts, request)
    expect(result.result).toBeDefined()
    expect(result.result?.email).toBe('andrey2')
  })

  it('should not login, wrong password', async () => {
    // Prepare account.
    await wrapCall(accounts, { method: 'createAccount', params: ['andrey2', '123'] })
    await wrapCall(accounts, { method: 'createWorkspace', params: ['workspace', 'OOO Horse Inc'] })
    await wrapCall(accounts, { method: 'addWorkspace', params: ['andrey2', 'workspace'] })

    const request: Request<[string, string, string]> = { method: 'login', params: ['andrey2', '1234', 'workspace'] }

    const result = await wrapCall(accounts, request)
    expect(result.error).toBeDefined()
    expect(result.error?.code).toBe(Code.status.Unauthorized)
  })

  it('should not login, unknown user', async () => {
    await wrapCall(accounts, { method: 'createWorkspace', params: ['workspace', 'OOO Horse Inc'] })

    const request: Request<[string, string, string]> = { method: 'login', params: ['andrey22', '1234', 'workspace'] }

    const result = await wrapCall(accounts, request)
    expect(result.error).toBeDefined()
    expect(result.error?.code).toBe(Code.status.AccountNotFound)
  })

  it('should not login, wrong workspace', async () => {
    // Prepare account.
    await wrapCall(accounts, { method: 'createAccount', params: ['andrey2', '123'] })

    const request: Request<[string, string, string]> = {
      method: 'login',
      params: ['andrey2', '123', 'non-existent-workspace']
    }

    const result = await wrapCall(accounts, request)
    expect(result.error).toBeDefined()
    expect(result.error?.code).toBe(Code.status.WorkspaceNotFound)
  })

  it('should not login, workspace not accessible', async () => {
    // Prepare account.
    await wrapCall(accounts, { method: 'createAccount', params: ['andrey2', '123'] })

    await wrapCall(accounts, { method: 'createWorkspace', params: ['workspace', 'OOO Horse Inc'] })
    await wrapCall(accounts, { method: 'createWorkspace', params: ['workspace2', 'OOO Horse Inc'] })
    await wrapCall(accounts, { method: 'addWorkspace', params: ['andrey2', 'workspace2'] })

    const request: Request<[string, string, string]> = {
      method: 'login',
      params: ['andrey2', '123', 'workspace']
    }

    const result = await wrapCall(accounts, request)
    expect(result.error).toBeDefined()
    expect(result.error?.code).toBe(Code.status.WorkspaceNotAccessible)
  })

  it('should update password', async () => {
    // Prepare account.
    await wrapCall(accounts, { method: 'createAccount', params: ['andrey2', '123'] })
    await wrapCall(accounts, { method: 'createWorkspace', params: ['workspace', 'OOO Horse Inc'] })
    await wrapCall(accounts, { method: 'addWorkspace', params: ['andrey2', 'workspace'] })

    const request: Request<[string, string, string]> = { method: 'updateAccount', params: ['andrey2', '123', '1234'] }

    const result = await wrapCall(accounts, request)
    expect(result.result).toBeDefined()
  })

  it('should not create account', async () => {
    // Prepare account.
    const s: string | undefined = undefined

    const result = await wrapCall(accounts, { method: 'createAccount', params: [s as unknown as string, '123'] })
    expect(result.error).toBeDefined()
  })

  it('should now allow undefined method', async () => {
    const request: Request<[string, string]> = { method: 'initDb', params: ['workspace', 'OOO Horse Inc'] }

    const result = await wrapCall(accounts, request)
    expect(result.error).toBeDefined()
  })
})
