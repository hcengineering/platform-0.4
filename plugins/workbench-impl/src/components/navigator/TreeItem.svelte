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
  import type { Action, AnyComponent } from '@anticrm/ui'
  import type { Class, Doc, Ref, Space } from '@anticrm/core'
  import { getClient } from '@anticrm/workbench'
  import type { QueryUpdater } from '@anticrm/presentation'
  import notification from '@anticrm/notification'
  import type { Notification } from '@anticrm/notification'
  import { getPlugin } from '@anticrm/platform'
  import { notificationPlugin } from '@anticrm/notification-impl'
  import Search from '../icons/Search.svelte'

  export let component: AnyComponent | undefined = undefined
  export let props: any | undefined
  export let icon: Asset | undefined
  export let space: Space
  export let objectsClass: Ref<Class<Doc>> | undefined

  let notifications = 0
  const client = getClient()
  const accountId = client.accountId()
  let query: QueryUpdater<Notification> | undefined

  $: {
    query = client.query(
      query,
      notification.class.Notification,
      {
        client: accountId,
        space: space._id
      },
      (result) => {
        notifications = result.length
      }
    )
  }

  const dispatch = createEventDispatcher()
  let actions: Array<Action> = []

  const subscribe: Action = {
    label: notification.string.Subscribe,
    icon: Search,
    action: async (): Promise<void> => {
      if (!objectsClass) return
      const notificationP = await getPlugin(notificationPlugin.id)
      await notificationP.subscribe(objectsClass, space._id, space._id)
      actions = [unsubscribe]
    }
  }
  const unsubscribe: Action = {
    label: notification.string.Unsubscribe,
    icon: Search,
    action: async (): Promise<void> => {
      if (!objectsClass) return
      const notificationP = await getPlugin(notificationPlugin.id)
      await notificationP.unsubscribe(objectsClass, space._id, space._id)
      actions = [subscribe]
    }
  }
  async function getAction (objectsClass: Ref<Class<Doc>> | undefined): Promise<void> {
    if (!objectsClass) {
      actions = []
      return
    }
    const notificationP = await getPlugin(notificationPlugin.id)
    const subscribed = await notificationP.getSubscibeStatus(objectsClass, space._id, space._id)
    actions = subscribed ? [unsubscribe] : [subscribe]
  }
</script>

{#await getAction(objectsClass) then value}
  <TreeElement
    {component}
    {props}
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
