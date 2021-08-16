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
  import { createEventDispatcher } from 'svelte'
  import { OK, Status, Severity } from '@anticrm/status'

  import Form from './Form.svelte'

  import loginImpl from '../plugin'

  import { getPlugin } from '@anticrm/platform'

  import login from '@anticrm/login'
  const loginPlugin = getPlugin(login.id)

  const dispatch = createEventDispatcher()

  export const LAST_WORKSPACE_KEY = 'anticrm-last-workspace'

  const fields = [
    { name: 'username', i18n: loginImpl.string.Email },
    {
      name: 'password',
      i18n: loginImpl.string.Password,
      password: true
    },
    { name: 'workspace', i18n: loginImpl.string.Workspace }
  ]

  const object = {
    workspace: localStorage.getItem(LAST_WORKSPACE_KEY) ?? '',
    username: '',
    password: ''
  }

  let status = OK

  const action = {
    i18n: loginImpl.string.LogIn,
    func: async () => {
      status = new Status(Severity.INFO, loginImpl.status.ConnectingToServer, {})

      const loginStatus = (await loginPlugin).doLogin(object.username, object.password, object.workspace)

      return new Promise<void>((resolve) => {
        loginStatus.then((newStatus) => {
          status = newStatus
          console.log('login status', status.code, OK.code)
          if (status.code === OK.code) {
            localStorage.setItem(LAST_WORKSPACE_KEY, object.workspace)
            // Login is success
            dispatch('open')
          }
          resolve()
        })
      })
    }
  }
</script>

<Form
  caption={loginImpl.string.LogIn}
  {status}
  {fields}
  {object}
  {action}
  bottomCaption={loginImpl.string.HaveAccount}
  bottomActionLabel={loginImpl.string.SignUp}
  bottomActionFunc={() => {
    dispatch('switch', 'signup')
  }}
/>
