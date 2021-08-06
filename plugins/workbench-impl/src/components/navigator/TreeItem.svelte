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
  import TreeElement from './TreeElement.svelte'
  import type { Asset } from '@anticrm/status'
  import { createEventDispatcher } from 'svelte'
  import type { QueryUpdater } from '@anticrm/presentation'
  import { getClient } from '@anticrm/workbench'
  import type { Space, Doc, Ref, Class } from '@anticrm/core'
  import type { LastView } from '@anticrm/notification'
  import notification from '@anticrm/notification'

  const client = getClient()
  const accountId = client.accountId()

  export let icon: Asset
  export let space: Space
  export let notificationObjectClass: Ref<Class<Doc>> | undefined

  let lastTimeQuery: QueryUpdater<LastView> | undefined
  let notificationQuery: QueryUpdater<Doc> | undefined

  $: if (notificationObjectClass) {
    lastTimeQuery = client.query(lastTimeQuery, notification.class.LastView, {
      objectClass: notificationObjectClass,
      objectSpace: space._id,
      client: accountId
    }, (result) => {
      const lastView = result.shift()
      if (lastView === undefined) return
      const time = lastView.lastTime
      notificationQuery = client.query(notificationQuery, notificationObjectClass!, {
      modifiedOn: { $gt: time }
      }, (result) => {
        notifications = result.length
      })
    })
  }

  let notifications = 0

  const dispatch = createEventDispatcher()
</script>

<TreeElement
  {icon}
  title={space.name}
  {notifications}
  collapsed
  on:click={() => {
    dispatch('click')
  }}
/>
