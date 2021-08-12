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
  import login, { currentAccount } from '@anticrm/login'
  import { Component } from '@anticrm/ui'

  import Workbench from './Workbench.svelte'

  async function connect (): Promise<PresentationClient> {
    return await PresentationClient.create()
  }

  let clientPromise = connect()

  let accountSet = false

  $: accountSet = currentAccount()?.clientUrl !== undefined
</script>

{#await clientPromise}
  <div />
{:then client}
  <Workbench {client} />
{:catch error}
  <Component
    is={login.component.LoginForm}
    on:open={() => {
      clientPromise = connect()
    }}
  />
{/await}
