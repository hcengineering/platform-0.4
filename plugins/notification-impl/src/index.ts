//
// Copyright © 2021 Anticrm Platform Contributors.
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
//
import type { Doc, Ref, Class, Space } from '@anticrm/core'
import type { NotificationService } from '@anticrm/notification'
import notification from '@anticrm/notification'
import { getPlugin } from '@anticrm/platform'
import notificationPlugin from './plugin'
import corePlugin, { Client } from '@anticrm/plugin-core'

export { notificationPlugin }

export default async (): Promise<NotificationService> => {
  const coreP = await getPlugin(corePlugin.id)
  const client: Client = await coreP.getClient()
  const accountId = client.accountId()

  async function subscribe<T extends Doc> (_class: Ref<Class<T>>, space: Ref<Space>, objectId: Ref<T>): Promise<void> {
    console.log('SUBSCRIBE CALL')
    const subscribes = await client.findAll(notification.class.Subscribe, {
      objectClass: _class,
      space: space,
      objectId: objectId
    })
    console.log(subscribes)
    const subscribe = subscribes.shift()
    if (subscribe === undefined) {
      console.log('create subscribe')
      await client.createDoc(notification.class.Subscribe, space, {
        objectClass: _class,
        objectId: objectId,
        clients: [accountId]
      })
    } else if (!subscribe.clients.includes(accountId)) {
      console.log('push subscribe')
      await client.updateDoc(subscribe._class, subscribe.space, subscribe._id, {
        $push: { clients: accountId }
      })
    }
  }

  async function unsubscribe<T extends Doc> (_class: Ref<Class<T>>, space: Ref<Space>, objectId: Ref<T>): Promise<void> {
    const subscribes = await client.findAll(notification.class.Subscribe, {
      objectClass: _class,
      space: space,
      objectId: objectId
    })
    const subscribe = subscribes.shift()
    if (subscribe === undefined || !subscribe.clients.includes(accountId)) return
    if (subscribe.clients.length === 1) {
      await client.removeDoc(subscribe._class, subscribe.space, subscribe._id)
    } else {
      await client.updateDoc(subscribe._class, subscribe.space, subscribe._id, {
        $pull: { clients: accountId }
      })
    }
  }

  async function getSubscibeStatus<T extends Doc> (
    _class: Ref<Class<T>>,
    space: Ref<Space>,
    objectId: Ref<T>
  ): Promise<boolean> {
    const subscribes = await client.findAll(notification.class.Subscribe, {
      objectClass: _class,
      space: space,
      objectId: objectId
    })
    const subscribe = subscribes.shift()
    if (subscribe === undefined) return false
    return subscribe.clients.includes(accountId)
  }

  return {
    subscribe,
    unsubscribe,
    getSubscibeStatus
  }
}
