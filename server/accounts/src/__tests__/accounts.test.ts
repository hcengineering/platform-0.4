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
import { AccountDetails, AccountInfo, Accounts, Code, generateToken, wrapCall } from '..'

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
    accounts = new Accounts(conn.db(DB_NAME), 'workspace', 'account', 'secret')
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
    await accounts.createWorkspace('workspace', 'OOO Horse Inc')

    const ws = await workspace().find({}).toArray()
    expect(ws.length).toEqual(1)

    const ws2 = await accounts.findWorkspace('workspace')
    expect(ws2).toBeDefined()
  })

  it('should not create duplicate workspace', async () => {
    await workspace().insertOne({ workspace: 'workspace', organisation: 'Bull Inc', accounts: [] })
    await expect(async () => await accounts.createWorkspace('workspace', 'OOO Horse Inc')).rejects.toThrow()
  })

  it('should create account', async () => {
    const result = await accounts.createAccount('andrey2', '123')
    expect(result).toBeDefined()

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
    await expect(async () => await accounts.createAccount('', '123')).rejects.toThrow()
  })

  it('should not create duplicate account', async () => {
    await account().insertOne({ email: 'andrey2', workspaces: [] })
    await expect(async () => await accounts.createAccount('andrey2', '123')).rejects.toThrow()
  })

  it('should add workspace', async () => {
    await accounts.createAccount('andrey2', '123')
    await accounts.createWorkspace('workspace', 'OOO Horse Inc')

    await accounts.addWorkspace('andrey2', 'workspace')
  })

  it('should login', async () => {
    // Prepare account.
    await accounts.createAccount('andrey2', '123')
    await accounts.createWorkspace('workspace', 'OOO Horse Inc')
    await accounts.addWorkspace('andrey2', 'workspace')

    const request: Request<[string, string, string]> = {
      method: 'login',
      params: ['andrey2', '123', 'workspace']
    }

    const result = await wrapCall<any[], AccountInfo>(accounts, request)
    expect(result.result).toBeDefined()
    expect(result.result?.email).toBe('andrey2')
  })

  it('should verify-token', async () => {
    // Prepare account.
    const a1 = await accounts.createAccount('andrey2', '123')
    const a2 = await accounts.createAccount('andrey3', '123')
    await accounts.createWorkspace('workspace', 'OOO Horse Inc')
    await accounts.addWorkspace('andrey2', 'workspace')

    const t1 = generateToken('secret', a1._id, 'workspace', { email: 'andrey2' })

    const request: Request<[string]> = {
      method: 'verify',
      params: [t1]
    }

    const result = await wrapCall<any[], AccountInfo>(accounts, request)
    expect(result.result).toBeDefined()
    expect(result.result?.email).toBe('andrey2')

    // Verify branches
    await expect(
      async () => await accounts.verify(generateToken('secret', 'non-id', 'workspace', { email: 'andrey2' }))
    ).rejects.toThrow()

    await expect(
      async () => await accounts.verify(generateToken('secret2', 'non-id', 'workspace', { email: 'andrey2' }))
    ).rejects.toThrow()

    await expect(
      async () => await accounts.verify(generateToken('secret', a1._id, 'workspace3', { email: 'andrey2' }))
    ).rejects.toThrow()

    await expect(
      async () => await accounts.verify(generateToken('secret', a1._id, 'workspace', { email: 'andrey3' }))
    ).rejects.toThrow()

    await expect(
      async () => await accounts.verify(generateToken('secret', a2._id, 'workspace', { email: 'andrey3' }))
    ).rejects.toThrow()
  })

  it('should not login, wrong password', async () => {
    // Prepare account.
    await accounts.createAccount('andrey2', '123')
    await accounts.createWorkspace('workspace', 'OOO Horse Inc')
    await accounts.addWorkspace('andrey2', 'workspace')

    const request: Request<[string, string, string]> = { method: 'login', params: ['andrey2', '1234', 'workspace'] }

    const result = await wrapCall(accounts, request)
    expect(result.error).toBeDefined()
    expect(result.error?.code).toBe(Code.status.Unauthorized)
  })

  it('should not login, unknown user', async () => {
    await accounts.createWorkspace('workspace', 'OOO Horse Inc')

    const request: Request<[string, string, string]> = { method: 'login', params: ['andrey22', '1234', 'workspace'] }

    const result = await wrapCall(accounts, request)
    expect(result.error).toBeDefined()
    expect(result.error?.code).toBe(Code.status.AccountNotFound)
  })

  it('should not login, wrong workspace', async () => {
    // Prepare account.
    await accounts.createAccount('andrey2', '123')

    const request: Request<[string, string, string]> = {
      method: 'login',
      params: ['andrey2', '123', 'non-existent-workspace']
    }

    const result = await wrapCall(accounts, request)
    expect(result.error).toBeDefined()
    expect(result.error?.code).toBe(Code.status.WorkspaceNotFound)
  })

  it('should not join, already joined', async () => {
    // Prepare account.
    await accounts.createAccount('andrey2', '123')
    await accounts.createWorkspace('workspace', 'ws1')

    await accounts.addWorkspace('andrey2', 'workspace')

    await expect(async () => await accounts.addWorkspace('andrey2', 'workspace')).rejects.toThrow()
  })

  it('should not signup, already joined', async () => {
    // Prepare account.
    await accounts.createAccount('andrey2', '123')
    await accounts.createWorkspace('workspace', 'ws1')
    await accounts.addWorkspace('andrey2', 'workspace')

    await expect(async () => await accounts.signup('andrey2', '123', 'workspace', {})).rejects.toThrow()
  })

  it('should not login, workspace not accessible', async () => {
    // Prepare account.
    await accounts.createAccount('andrey2', '123')
    await accounts.createWorkspace('workspace', 'OOO Horse Inc')
    await accounts.createWorkspace('workspace2', 'OOO Horse Inc')
    await accounts.addWorkspace('andrey2', 'workspace2')

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
    await accounts.createAccount('andrey2', '123')
    await accounts.createWorkspace('workspace', 'OOO Horse Inc')
    await accounts.addWorkspace('andrey2', 'workspace')

    const { token } = await accounts.login('andrey2', '123', 'workspace')

    const request: Request<[string, string, string]> = { method: 'updateAccount', params: [token, '123', '1234'] }

    const result = await wrapCall(accounts, request)
    expect(result.error).toBeUndefined()
    expect(result.result).toBeDefined()
  })

  it('should not create account', async () => {
    // Prepare account.
    const s: string | undefined = undefined

    await expect(async () => await accounts.createAccount(s as unknown as string, '123')).rejects.toThrow()
  })

  it('should now allow undefined method', async () => {
    const request: Request<[string, string]> = { method: 'initDb', params: ['workspace', 'OOO Horse Inc'] }

    const result = await wrapCall(accounts, request)
    expect(result.error).toBeDefined()
  })
})
