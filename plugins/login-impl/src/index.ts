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

import login, { ACCOUNT_KEY, LoginInfo, LoginService, SignupDetails } from '@anticrm/login'
import { broadcastEvent, getMetadata, setResource } from '@anticrm/platform'
import { AnyRequest, Request, Response, serialize } from '@anticrm/rpc'
import { OK, PlatformError, Severity, Status, unknownError } from '@anticrm/status'
import LoginApp from './components/LoginApp.svelte'
import SettingForm from './components/SettingForm.svelte'

function getAccountUrl (): string {
  const accountsUrl = getMetadata(login.metadata.AccountsUrl)
  if (accountsUrl === undefined) {
    throw new PlatformError(new Status(Severity.ERROR, login.status.NoAccountUri, {}))
  }
  return accountsUrl
}
async function doPostRequest<P extends any[], M extends string> (
  accountsUrl: string,
  request: Request<P, M>
): Promise<Response<LoginInfo>> {
  const response = await fetch(accountsUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=utf-8'
    },
    body: serialize(request)
  })
  return await response.json()
}

class LoginServiceImpl implements LoginService {
  async setLoginInfo (loginInfo?: LoginInfo): Promise<Status> {
    if (loginInfo === undefined) {
      localStorage.removeItem(ACCOUNT_KEY)
    } else {
      localStorage.setItem(ACCOUNT_KEY, JSON.stringify(loginInfo))
    }

    await broadcastEvent('Token', loginInfo?.token)
    return OK
  }

  async getLoginInfo (): Promise<LoginInfo | undefined> {
    const account = localStorage.getItem(ACCOUNT_KEY)
    if (account == null) {
      return undefined
    }
    return JSON.parse(account) as LoginInfo
  }

  async doRequest (request: AnyRequest): Promise<Status> {
    try {
      const result = await doPostRequest(getAccountUrl(), request)
      return result.error ?? (await this.setLoginInfo(result.result))
    } catch (err) {
      return unknownError(err as Error)
    }
  }

  async saveSetting (password: string, newPassword: string): Promise<Status> {
    const loginInfo = await this.getLoginInfo()
    if (loginInfo === undefined) {
      return new Status(Severity.ERROR, login.status.UnAuthorized, {})
    }
    return await this.doRequest({ method: 'updateAccount', params: [loginInfo.email, password, newPassword] })
  }

  /**
   * Perform a login operation to required workspace with user credentials.
   */
  async doLogin (username: string, password: string, workspace: string): Promise<Status> {
    return await this.doRequest({ method: 'login', params: [username, password, workspace] })
  }

  async doSignup (username: string, password: string, workspace: string, details: SignupDetails): Promise<Status> {
    return await this.doRequest({ method: 'signup', params: [username, password, workspace, details] })
  }

  async doVerify (): Promise<Status> {
    const account = localStorage.getItem(ACCOUNT_KEY)

    const info = account !== null ? (JSON.parse(account) as LoginInfo) : undefined

    if (info !== undefined) {
      // We need to verify token.
      return await this.doRequest({ method: 'verify', params: [info.token] })
    }
    return new Status(Severity.ERROR, login.status.UnAuthorized, {})
  }

  async doLogout (): Promise<Status> {
    return await this.setLoginInfo(undefined)
  }
}

export default async (): Promise<LoginService> => {
  setResource(login.component.LoginForm, LoginApp)
  setResource(login.component.SettingForm, SettingForm)

  return new LoginServiceImpl()
}
