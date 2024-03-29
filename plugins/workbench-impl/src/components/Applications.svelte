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
  import { Class, Ref, Space } from '@anticrm/core'
  import type { QueryUpdater } from '@anticrm/presentation'
  import { getRouter } from '@anticrm/ui'
  import type { SpaceLastViews } from '@anticrm/notification'
  import type { Application, WorkbenchRoute } from '@anticrm/workbench'
  import workbench, { getClient } from '@anticrm/workbench'
  import AppItem from './AppItem.svelte'

  export let active: Ref<Application> | undefined
  export let spacesLastViews: Map<Ref<Space>, SpaceLastViews>
  let notificatedClasses: Set<Ref<Class<Space>>> = new Set<Ref<Class<Space>>>()

  let apps: Application[] = []

  const client = getClient()
  let query: QueryUpdater<Application> | undefined

  const router = getRouter<WorkbenchRoute>()

  query = client.query(query, workbench.class.Application, {}, (result) => {
    apps = result
  })

  function navigateApp (app: Ref<Application>) {
    router.navigate({ app })
  }

  $: getNotificatedClasses(spacesLastViews)

  async function getNotificatedClasses (spacesLastViews: Map<Ref<Space>, SpaceLastViews>): Promise<void> {
    const notificatedSpaces = Array.from(spacesLastViews.values()).filter((s) => s.notificatedObjects.length > 0)
    notificatedClasses = new Set(notificatedSpaces.map((s) => s.objectClass))
  }

  function hasNotify (app: Application, notificatedClasses: Set<Ref<Class<Space>>>): boolean {
    const appSpaceClasses = new Set(app.navigatorModel?.spaces.map((p) => p.spaceClass))
    for (const spaceClass of appSpaceClasses ?? []) {
      if (notificatedClasses.has(spaceClass)) return true
    }
    return false
  }
</script>

<div class="flex-col">
  {#each apps as app}
    <AppItem
      selected={app._id === active}
      icon={app.icon}
      label={app.label}
      notify={hasNotify(app, notificatedClasses)}
      action={async () => {
        navigateApp(app._id)
      }}
    />
  {/each}
</div>
