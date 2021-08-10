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
  import { createEventDispatcher, onDestroy, afterUpdate } from 'svelte'
  import type { Space, Doc, Ref, Class } from '@anticrm/core'
  import { notificationPlugin } from '@anticrm/notification-impl'
  import notification from '@anticrm/notification'
  import type { Action } from '@anticrm/ui'
  import Search from '../icons/Search.svelte'
  import { getPlugin } from '@anticrm/platform'

  export let icon: Asset
  export let space: Space
  export let notificationObjectClass: Ref<Class<Doc>> | undefined
  let actions: Array<Action> = []

  let unsubscribeQuery = () => {}

  afterUpdate(async () => {
    if (notificationObjectClass) {
      const notificationP = await getPlugin(notificationPlugin.id)
      unsubscribeQuery = notificationP.spaceNotifications(notificationObjectClass, space._id, (result) => {
        notifications = result.length
      })
    } else {
      unsubscribeQuery()
      actions = []
    }
  })

  onDestroy(() => {
    unsubscribeQuery()
  })

  let notifications = 0

  const dispatch = createEventDispatcher()

  const subscribe: Action = {
    label: notification.string.Subscribe,
    icon: Search,
    action: async (): Promise<void> => {
      if (!notificationObjectClass) return
      const notificationP = await getPlugin(notificationPlugin.id)
      await notificationP.subscribeSpace(notificationObjectClass, space._id)
      await getAction(notificationObjectClass)
    }
  }

  const unsubscribe: Action = {
    label: notification.string.Unsubscribe,
    icon: Search,
    action: async (): Promise<void> => {
      if (!notificationObjectClass) return
      const notificationP = await getPlugin(notificationPlugin.id)

      await notificationP.unsubscribeSpace(notificationObjectClass, space._id)
      await getAction(notificationObjectClass)
    }
  }

  async function getAction (notificationObjectClass: Ref<Class<Doc>> | undefined): Promise<void> {
    if (!notificationObjectClass) {
      actions = []
      return
    }
    const notificationP = await getPlugin(notificationPlugin.id)
    const subscribed = await notificationP.getSubscibeStatus(notificationObjectClass, space._id)
    actions = subscribed ? [unsubscribe] : [subscribe]
  }
</script>

{#await getAction(notificationObjectClass) then value}
  <TreeElement
    {icon}
    title={space.name}
    {notifications}
    collapsed
    {actions}
    on:click={() => {
      dispatch('click')
    }}
  />
{/await}
