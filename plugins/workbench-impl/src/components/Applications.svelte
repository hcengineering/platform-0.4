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

  import { onDestroy, createEventDispatcher } from 'svelte'
  import type { Ref } from '@anticrm/core'
  import type { Application } from '@anticrm/workbench'
  import workbench, { getClient } from '@anticrm/workbench'

  import AppItem from './AppItem.svelte'

  let apps: Application[] = []
  onDestroy(getClient().query(workbench.class.Application, {}, result => { apps = result }))

  const dispatch = createEventDispatcher()
  let active: Ref<Application> | undefined
  
  function onAppChange(app: Application) {
    active = app._id
    dispatch('app-change', app)
  }

</script>

<div class="app-icons">
  {#each apps as app}
    <div class="app">
      <AppItem selected={app._id === active} icon={app.icon} label={app.label} notify action={async () => {onAppChange(app)}}/>
    </div>
  {/each}
</div>

<style lang="scss">
  .app-icons {
    .app {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 48px;
      height: 48px;
    }
    .app + .app {
      margin-top: 4px;
    }
  }
</style>