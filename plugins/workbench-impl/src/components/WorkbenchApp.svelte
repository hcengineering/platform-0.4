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
  import { PresentationClient } from '@anticrm/presentation'
  import login, { verifyToken } from '@anticrm/login'
  import { Component, Spinner } from '@anticrm/ui'
  import pluginCore from '@anticrm/plugin-core'

  import Workbench from './Workbench.svelte'
  import { getPlugin } from '@anticrm/platform'
  import { PlatformError, Severity } from '@anticrm/status'

  async function connect (): Promise<PresentationClient> {
    const st = await verifyToken()
    if (st.severity !== Severity.OK) {
      throw new PlatformError(st)
    }
    const plugin = await getPlugin(pluginCore.id)
    const accountId = (await plugin.getClient()).accountId()
    return await PresentationClient.create(accountId, async () => await plugin.getClient())
  }

  let clientPromise = connect()

  $: clientPromise.catch((e) => console.error(e))

  async function doLogout (): Promise<void> {
    const loginPlugin = await getPlugin(login.id)
    loginPlugin.doLogout()

    const corePlugin = await getPlugin(pluginCore.id)
    corePlugin.disconnect()

    clientPromise = connect()
  }
</script>

{#await clientPromise}
  <Spinner />
{:then client}
  <Workbench {client} on:logout={doLogout} />
{:catch}
  <Component
    is={login.component.LoginForm}
    on:open={() => {
      clientPromise = connect()
    }}
  />
{/await}
