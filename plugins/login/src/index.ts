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

// P L U G I N

import type { Metadata, Plugin, Service } from '@anticrm/platform'
import { plugin } from '@anticrm/platform'
import { Status, StatusCode } from '@anticrm/status'
import type { AnyComponent } from '@anticrm/status'

/**
 * @public
 */
export interface LoginInfo {
  email: string
  workspace: string
  token: string
}

/**
 * @public
 */
export interface SignupDetails {
  firstName: string
  lastName: string
}

/**
 * @public
 */
export const ACCOUNT_KEY = 'anticrm-account'

/**
 * @public
 */
export function currentAccount (): LoginInfo | undefined {
  const account = localStorage.getItem(ACCOUNT_KEY)
  return account !== null ? JSON.parse(account) : undefined
}

/**
 * @public
 */
export interface LoginService extends Service {
  doLogin: (username: string, password: string, workspace: string) => Promise<Status>
  doSignup: (username: string, password: string, workspace: string, details: SignupDetails) => Promise<Status>

  /**
   * Check and auto return login information if available.
   */
  getLoginInfo: () => Promise<LoginInfo | undefined>
  /**
   * Save profile settings
   */
  saveSetting: (password: string, newPassword: string) => Promise<Status>
  /**
   * Do logout from current logged in account
   */
  doLogout: () => Promise<void>
}

const PluginLogin = 'login' as Plugin<LoginService>

/**
 * @public
 */
const login = plugin(
  PluginLogin,
  {},
  {
    component: {
      LoginForm: '' as AnyComponent,
      SettingForm: '' as AnyComponent,
      MainLoginForm: '' as AnyComponent,
      SignupForm: '' as AnyComponent
    },
    metadata: {
      AccountsUrl: '' as Metadata<string>
    },
    status: {
      UnAuthorized: '' as StatusCode,
      NoAccountUri: '' as StatusCode,
      ServerNotAvailable: '' as StatusCode
    }
  }
)
/**
 * @public
 */
export default login
