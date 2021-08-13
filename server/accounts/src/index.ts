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

import { generateId, Ref, Account as CoreAccount } from '@anticrm/core'
import { ReqId, Request, Response } from '@anticrm/rpc'
import { Component, component, PlatformError, Severity, Status, StatusCode, unknownError } from '@anticrm/status'
import { Buffer } from 'buffer'
import { pbkdf2Sync, randomBytes } from 'crypto'
import { encode } from 'jwt-simple'
import { Binary, Collection, Db, ObjectId } from 'mongodb'

/**
 * @public
 */
export interface Account {
  _id: Ref<CoreAccount>
  details: AccountDetails
  hash: Binary
  salt: Binary
  workspaces: ObjectId[]
}

/**
 * @public
 */
export interface AccountDetails {
  email: string
  firstName?: string
  lastName?: string
}

/**
 * @public
 */
export type AccountInfo = Omit<Account, 'hash' | 'salt'>

/**
 * @public
 */
export interface Workspace {
  _id: ObjectId
  workspace: string
  organisation: string
  accounts: Ref<CoreAccount>[]
}

/**
 * @public
 */
export interface LoginInfo {
  email: string
  workspace: string
  clientUrl: string
}

/**
 * @public
 */
export interface ServerInfo {
  server: string
  port: number
  tokenSecret: string
}

/**
 * @public
 */
export const Code = component('account' as Component, {
  status: {
    WorkspaceNotFound: '' as StatusCode<{workspace: string}>,
    AccountNotFound: '' as StatusCode<{email: string}>,
    Unauthorized: '' as StatusCode<{}>,
    DuplicateAccount: '' as StatusCode<{email: string}>,
    DuplicateWorkspace: '' as StatusCode<{workspace: string}>,
    WorkspaceNotAccessible: '' as StatusCode<{workspace: string, email: string}>,
    WorkspaceAlreadyJoined: '' as StatusCode<{workspace: string, email: string}>,
    InvalidRequest: '' as StatusCode<{}>
  }
})

function hashWithSalt (password: string, salt: Buffer): Buffer {
  return pbkdf2Sync(password, salt, 1000, 32, 'sha256')
}

function verifyPassword (password: string, hash: Buffer, salt: Buffer): boolean {
  return Buffer.compare(hash, hashWithSalt(password, salt)) === 0
}

function toAccountInfo (account: Account): AccountInfo {
  const { hash, salt, ...result } = account
  return result
}

function checkDefined (msg: string, ...params: (string|undefined)[]): void {
  for (const p of params) {
    if (p == null || p.trim().length === 0) {
      throw Error(msg)
    }
  }
}

/**
 * @public
 */
export class Accounts {
  methods: Record<string, any>
  constructor (readonly db: Db, readonly workspaceCollection: string, readonly accountCollection: string, readonly server: ServerInfo) {
    // A list of allowed operations
    this.methods = {
      login: this.login.bind(this),
      signup: this.signup.bind(this),
      createAccount: this.createAccount.bind(this),
      createWorkspace: this.createWorkspace.bind(this),
      addWorkspace: this.addWorkspace.bind(this),
      updateAccount: this.updateAccount.bind(this)
    }
  }


  public async getWorkspace (workspace: string): Promise<Workspace> {
    const result = await this.workspaces().findOne<Workspace>({ workspace })

    if (result != null) {
      return result
    }
    throw new PlatformError(new Status(Severity.ERROR, Code.status.WorkspaceNotFound, { workspace }))
  }

  workspaces (): Collection<Workspace> {
    return this.db.collection(this.workspaceCollection)
  }

  accounts (): Collection<Account> {
    return this.db.collection(this.accountCollection)
  }

  /**
   * Initialize account DB and required indexes. Should be called on empty DB.
   *
   */
  public async initAccountDb (): Promise<void> {
    await this.accounts().createIndex({ email: 1 }, { unique: true })
    await this.workspaces().createIndex({ workspace: 1 }, { unique: true })
  }


  async getAccount (email: string): Promise<Account> {
    const account = await this.accounts().findOne<Account>({ email })
    if (account != null) {
      return account
    }
    throw new PlatformError(new Status(Severity.ERROR, Code.status.AccountNotFound, { email }))
  }

  public async findAccount (email: string): Promise<AccountInfo | undefined> {
    return await this.accounts().findOne<Account>({ email }).then(acc => acc !== null ? toAccountInfo(acc) : undefined)
  }

  public async findWorkspace (workspace: string): Promise<Workspace | undefined> {
    return await this.workspaces().findOne<Workspace>({ workspace }) ?? undefined
  }


  async getAccountVerify (email: string, password: string): Promise<Account> {
    const account = await this.getAccount(email)

    if (!verifyPassword(password ?? '', account.hash.buffer, account.salt.buffer)) {
      throw new PlatformError(new Status(Severity.ERROR, Code.status.Unauthorized, {}))
    }
    return account
  }

  wrapDuplicateError<T extends StatusCode<P>, P extends Record<string, any>> (err: any, code: T, vars: P): PlatformError<P | {}> {
    return err.code === 11000 ? new PlatformError(new Status(Severity.ERROR, code, vars)) : new PlatformError(unknownError(err))
  }

  async createAccount (email: string, password: string, details?: AccountDetails): Promise<AccountInfo> {
    checkDefined('email and password should be specified', email, password)

    const salt = randomBytes(32)
    const hash = hashWithSalt(password, salt)

    try {
      const accountDetails = { firstName: '', lastName: '', ...details, email }
      const result = await this.accounts().insertOne({ _id: generateId(), hash: new Binary(hash), salt: new Binary(salt), workspaces: [], details: accountDetails })

      // We need to connect to server and create an Account entry with all required information for user.


      return { _id: result.insertedId, workspaces: [], details: accountDetails }
    } catch (err) {
      throw this.wrapDuplicateError(err, Code.status.DuplicateAccount, { email })
    }
  }

  async createWorkspace (workspace: string, organisation: string): Promise<ObjectId> {
    checkDefined('workspace and organization should be specified', workspace, organisation)

    try {
      const result = await this.workspaces().insertOne({ workspace, organisation, accounts: [] })
      return result.insertedId
    } catch (err) {
      throw this.wrapDuplicateError(err, Code.status.DuplicateWorkspace, { workspace })
    }
  }

  async addWorkspace (email: string, workspace: string): Promise<void> {
    checkDefined('email and workspace should be specified', email, workspace)

    const ws = await this.getWorkspace(workspace)
    const account = await this.getAccount(email)

    await this.workspaces().updateOne({ _id: ws._id }, { $push: { accounts: account._id } })
    await this.accounts().updateOne({ _id: account._id }, { $push: { workspaces: ws._id } })
  }

  async login (email: string, password: string, workspace: string): Promise<LoginInfo> {
    checkDefined('email and password should be specified', email, password)

    const workspaceInfo = await this.getWorkspace(workspace)
    const accountInfo = await this.getAccountVerify(email, password)

    const ws = accountInfo.workspaces.find(w => w.equals(workspaceInfo._id))
    if (ws !== undefined) {
      const token = encode({
        accountId: accountInfo._id,
        workspaceId: workspace,
        details: { ...accountInfo.details, email }
      }, this.server.tokenSecret)
      const result: LoginInfo = {
        workspace,
        clientUrl: `${this.server.server}:${this.server.port}/${token}`,
        email
      }
      return result
    }
    throw new PlatformError(new Status(Severity.ERROR, Code.status.WorkspaceNotAccessible, { workspace, email }))
  }

  async signup (email: string, password: string, workspace: string, details: AccountDetails): Promise<LoginInfo> {
    checkDefined('email and password should be specified', email, password)

    const workspaceInfo = await this.getWorkspace(workspace)

    let accountInfo = await this.findAccount(email)
    if (accountInfo === undefined) {
      // Will in account information
      accountInfo = await this.createAccount(email, password, details)
    }

    for (const w of accountInfo.workspaces) {
      if (w.equals(workspaceInfo._id)) {
        // Workspace is already exists
        throw new PlatformError(new Status(Severity.ERROR, Code.status.WorkspaceAlreadyJoined, { workspace, email }))
      }
    }
    // Add workspace
    await this.addWorkspace(email, workspace)
    // Do login
    return await this.login(email, password, workspace)
  }


  async updateAccount (email: string, password: string, newPassword: string): Promise<AccountInfo> {
    checkDefined('email and password should be specified', email, password)

    const account = await this.getAccountVerify(email, password)

    const hash = hashWithSalt(newPassword, account.salt.buffer)
    await this.accounts().updateOne({ _id: account._id }, {
      $set: {
        hash: new Binary(hash)
      }
    })
    return toAccountInfo(account)
  }

  async reflectCall<T extends any[], P>(request: Request<T>): Promise<Response<P>> {
    const { id, method, params } = request
    const methodOp = this.methods[method]
    if (methodOp === undefined) {
      return { id, error: new Status(Severity.ERROR, Code.status.InvalidRequest, { }) }
    }
    return { id, result: await reflectCall<P>(this, methodOp, params) }
  }
}

/**
 * @public
 */
export async function wrapCall<T extends any[], P> (accounts: Accounts, request: Request<T>): Promise<Response<P>> {
  return await accounts.reflectCall<T, P>(request).then(result => result, (reason) => unwrapError(request.id, reason))
}
async function reflectCall<P> (accounts: Accounts, method: any, params: any): Promise<P> {
  return await (Reflect.apply(method, accounts, params) as Promise<P>)
}

function unwrapError<P> (id: ReqId | undefined, error: any): Response<P> {
  if (error instanceof PlatformError) {
    return { id, error: error.status }
  }
  return { id, error: new Status(Severity.ERROR, Code.status.InvalidRequest, { }) }
}
