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

  import { Icon } from '@anticrm/ui'

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
    <div class="app" class:selected={app._id === active} on:click={() => onAppChange(app)}>
      <Icon icon={app.icon} size="32px" fill="var(--theme-caption-color)"/>
    </div>
  {/each}
</div>

<style lang="scss">
  .app-icons {
    .app {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 52px;
      height: 52px;
      border-radius: 8px;
      cursor: pointer;
      opacity: .3;
      &.selected {
        opacity: 1;
        background-color: var(--theme-menu-selection);
      }
    }
    .app + .app {
      margin-top: 8px;
    }
  }
</style>