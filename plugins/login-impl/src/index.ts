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
import { getMetadata, setMetadata, setResource } from '@anticrm/platform'
import pluginCore from '@anticrm/plugin-core'
import { OK, PlatformError, Severity, Status, unknownError } from '@anticrm/status'
import { Request, Response, serialize } from '@anticrm/rpc'
import LoginApp from './components/LoginApp.svelte'
import SettingForm from './components/SettingForm.svelte'

export default async (): Promise<LoginService> => {
  setResource(login.component.LoginForm, LoginApp)

  const accountsUrl = getMetadata(login.metadata.AccountsUrl)
  if (accountsUrl === undefined) {
    throw new PlatformError(new Status(Severity.ERROR, login.status.NoAccountUri, {}))
  }
  setResource(login.component.SettingForm, SettingForm)

  function setLoginInfo (loginInfo: LoginInfo): void {
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(loginInfo))

    setMetadata(pluginCore.metadata.ClientUrl, loginInfo.clientUrl)
  }

  function clearLoginInfo (): void {
    localStorage.removeItem(ACCOUNT_KEY)

    setMetadata(pluginCore.metadata.ClientUrl, undefined)
    setMetadata(pluginCore.metadata.AccountId, undefined)
  }

  async function getLoginInfo (): Promise<LoginInfo | undefined> {
    const account = localStorage.getItem(ACCOUNT_KEY)
    if (account == null) {
      return await Promise.resolve(undefined)
    }
    const loginInfo = JSON.parse(account) as LoginInfo

    // Do some operation to check if token is expired or not.
    return await Promise.resolve(loginInfo)
  }

  async function saveSetting (password: string, newPassword: string): Promise<Status> {
    const loginInfo = await getLoginInfo()
    if (loginInfo == null) return new Status(Severity.ERROR, login.status.UnAuthorized, {})
    const request: Request<[string, string, string]> = {
      method: 'updateAccount',
      params: [loginInfo.email, password, newPassword]
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const response = await fetch(accountsUrl!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=utf-8'
        },
        body: serialize(request)
      })
      const result = (await response.json()) as Response<any>
      if (result.error !== undefined) {
        return result.error
      }
      if (result.result !== undefined) {
        setLoginInfo(result.result)
      }
      return OK
    } catch (err) {
      return new Status(Severity.ERROR, login.status.ServerNotAvailable, {})
    }
  }
  /**
   * Perform a login operation to required workspace with user credentials.
   */
  async function doLogin (username: string, password: string, workspace: string): Promise<Status> {
    const accountsUrl = getMetadata(login.metadata.AccountsUrl) ?? 'localhost:18080'

    const request: Request<[string, string, string]> = {
      method: 'login',
      params: [username, password, workspace]
    }

    try {
      const response = await fetch(accountsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=utf-8'
        },
        body: serialize(request)
      })
      const result: Response<LoginInfo> = await response.json()
      const status = result.error ?? OK
      if (result.result !== undefined) {
        setLoginInfo(result.result)
      }
      return status
    } catch (err) {
      return unknownError(err)
    }
  }
  async function doSignup (
    username: string,
    password: string,
    workspace: string,
    details: SignupDetails
  ): Promise<Status> {
    const accountsUrl = getMetadata(login.metadata.AccountsUrl) ?? 'localhost:18080'

    const request: Request<[string, string, string, SignupDetails]> = {
      method: 'signup',
      params: [username, password, workspace, details]
    }

    try {
      const response = await fetch(accountsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=utf-8'
        },
        body: serialize(request)
      })
      const result: Response<LoginInfo> = await response.json()
      const status = result.error ?? OK
      if (result.result !== undefined) {
        setLoginInfo(result.result)
      }
      return status
    } catch (err) {
      return unknownError(err)
    }
  }

  async function doLogout (): Promise<void> {
    clearLoginInfo()
    return await Promise.resolve()
  }

  return {
    doLogin,
    doSignup,
    doLogout,
    getLoginInfo,
    saveSetting
  }
}
