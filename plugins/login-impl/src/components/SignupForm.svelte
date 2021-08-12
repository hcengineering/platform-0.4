<!--
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
-->
<script lang="ts">
  import statusCode, { OK, Severity, Status } from '@anticrm/status'
  import { createEventDispatcher } from 'svelte'
  import Form from './Form.svelte'
  import { translate } from '@anticrm/platform'

  const dispatch = createEventDispatcher()

  import { getPlugin } from '@anticrm/platform'
  import login from '@anticrm/login'
  const loginPlugin = getPlugin(login.id)

  import loginImpl from '../plugin'

  const fields = [
    { name: 'first', i18n: loginImpl.string.FirstName, short: true },
    { name: 'last', i18n: loginImpl.string.LastName, short: true },
    { name: 'username', i18n: loginImpl.string.Email },
    { name: 'workspace', i18n: loginImpl.string.Workspace },
    { name: 'password', i18n: loginImpl.string.Password, password: true },
    { name: 'password2', i18n: loginImpl.string.Password2, password: true }
  ]

  const object = {
    first: '',
    last: '',
    workspace: '',
    username: '',
    password: '',
    password2: ''
  }

  let status = OK

  const action = {
    i18n: loginImpl.string.SignUp,
    func: async () => {
      if (object.password !== object.password2) {
        status = new Status(Severity.INFO, statusCode.status.OK, translate(loginImpl.string.PasswordMismatch, {}))
        return Promise.resolve()
      }
      status = new Status(Severity.INFO, statusCode.status.OK, 'Соединяюсь с сервером...')

      const signupResult = (await loginPlugin).doSignup(object.username, object.password, object.workspace, {
        firstName: object.first,
        lastName: object.last
      })

      return new Promise<void>((resolve) => {
        signupResult.then((newStatus) => {
          status = newStatus
          resolve()
        })
      })
    }
  }
</script>

<Form
  caption={loginImpl.string.SignUp}
  {status}
  {fields}
  {object}
  {action}
  bottomCaption={loginImpl.string.HaveAccount}
  bottomActionLabel={loginImpl.string.LogIn}
  bottomActionFunc={() => {
    dispatch('switch', 'login')
  }}
/>
