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
import { Ref, Class, Doc, Space, DocumentQuery, FindResult, Data, Timestamp } from '@anticrm/core'
import { getPlugin } from '@anticrm/platform'
import corePlugin, { Client } from '@anticrm/plugin-core'
import type { NotificationService, SpaceSubscribe, Notification } from '@anticrm/notification'
import notification from '@anticrm/notification'
import notificationPlugin from './plugin'

export { notificationPlugin }

export default async (): Promise<NotificationService> => {
  const coreP = await getPlugin(corePlugin.id)
  const client: Client = await coreP.getClient()
  const accountId = client.accountId()

  async function markAsRead<T extends Doc> (
    objectClass: Ref<Class<T>>,
    space: Ref<Space>,
    withObjects: boolean = false,
    toTime?: Timestamp
  ): Promise<void> {
    const query = {
      objectClass: objectClass,
      space: space,
      client: accountId
    }
    await client.findAll(notification.class.SpaceSubscribe, query).then(async (subscribes) => {
      for (const subscribe of subscribes) {
        await client.updateDoc(subscribe._class, subscribe.space, subscribe._id, {
          lastTime: toTime ?? new Date().getTime()
        })
      }
    })
    if (withObjects) {
      await client.findAll(notification.class.Notification, query).then(async (subscribes) => {
        for (const subscribe of subscribes) {
          await client.removeDoc(subscribe._class, subscribe.space, subscribe._id)
        }
      })
    }
  }

  async function markAsReadObject<T extends Doc> (
    objectClass: Ref<Class<T>>,
    space: Ref<Space>,
    objectId: Ref<T>
  ): Promise<void> {
    const query = {
      objectClass: objectClass,
      space: space,
      client: accountId,
      objectId: objectId
    }
    await client.findAll(notification.class.Notification, query).then(async (subscribes) => {
      for (const subscribe of subscribes) {
        await client.removeDoc(subscribe._class, subscribe.space, subscribe._id)
      }
    })
  }

  async function getSubscibeStatus<T extends Doc> (_class: Ref<Class<T>>, space: Ref<Space>): Promise<boolean> {
    const subscribes = await client.findAll(notification.class.SpaceSubscribe, {
      objectClass: _class,
      space: space,
      client: accountId
    })
    return subscribes.length > 0
  }

  async function getObjectSubscibeStatus<T extends Doc> (
    _class: Ref<Class<T>>,
    space: Ref<Space>,
    objectId: Ref<T>
  ): Promise<boolean> {
    const subscribes = await client.findAll(notification.class.ObjectSubscribe, {
      objectClass: _class,
      space: space,
      objectId: objectId
    })
    const subscribe = subscribes.shift()
    if (subscribe === undefined) return false
    return subscribe.clients.includes(accountId)
  }

  async function subscribeSpace<T extends Doc> (_class: Ref<Class<T>>, space: Ref<Space>): Promise<void> {
    if (await getSubscibeStatus(_class, space)) return
    const obj: Data<SpaceSubscribe<T>> = {
      objectClass: _class,
      client: accountId,
      lastTime: new Date().getTime()
    }
    await client.createDoc(notification.class.SpaceSubscribe, space, obj)
  }

  async function subscribeObject<T extends Doc> (
    _class: Ref<Class<T>>,
    space: Ref<Space>,
    objectId: Ref<T>
  ): Promise<void> {
    const subscribes = await client.findAll(notification.class.ObjectSubscribe, {
      objectClass: _class,
      space: space,
      objectId: objectId
    })
    const subscribe = subscribes.shift()
    if (subscribe === undefined) {
      await client.createDoc(notification.class.ObjectSubscribe, space, {
        objectClass: _class,
        objectId: objectId,
        clients: [accountId]
      })
    } else if (!subscribe.clients.includes(accountId)) {
      await client.updateDoc(subscribe._class, subscribe.space, subscribe._id, {
        $push: { clients: accountId }
      })
    }
  }

  async function unsubscribeSpace<T extends Doc> (_class: Ref<Class<T>>, space: Ref<Space>): Promise<void> {
    const subscribes = await client.findAll(notification.class.SpaceSubscribe, {
      objectClass: _class,
      space: space,
      client: accountId
    })
    const subscribe = subscribes.shift()
    if (subscribe === undefined) return

    await client.removeDoc(subscribe._class, subscribe.space, subscribe._id)
  }

  async function unsubscribeObject<T extends Doc> (
    _class: Ref<Class<T>>,
    space: Ref<Space>,
    objectId: Ref<T>
  ): Promise<void> {
    const subscribes = await client.findAll(notification.class.ObjectSubscribe, {
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

  function spaceNotifications<T extends Doc> (
    _class: Ref<Class<T>>,
    space: Ref<Space>,
    callback: (result: T[]) => void
  ): () => void {
    let objectSubscribe: () => void = () => {}
    const lastViewedSubscribe = client.query(
      notification.class.SpaceSubscribe,
      {
        objectClass: _class,
        space: space,
        client: accountId
      },
      (result) => {
        const subscribe = result.shift()
        objectSubscribe()
        if (subscribe !== undefined) {
          objectSubscribe = querySpace(subscribe as SpaceSubscribe<T>, _class, space, callback)
        } else {
          objectSubscribe = queryNotification(_class, space, callback)
        }
      }
    )
    const unsubscribes = (): void => {
      objectSubscribe()
      lastViewedSubscribe()
    }
    return unsubscribes
  }

  function objectNotifications<T extends Doc> (
    _class: Ref<Class<T>>,
    space: Ref<Space>,
    objectId: Ref<T>,
    callback: (result: Notification[]) => void
  ): () => void {
    return client.query<Notification>(
      notification.class.Notification,
      {
        space: space,
        objectClass: _class,
        client: accountId,
        objectId: objectId
      },
      callback
    )
  }

  function querySpace<T extends Doc> (
    subscribe: SpaceSubscribe<T>,
    _class: Ref<Class<T>>,
    space: Ref<Space>,
    callback: (result: T[]) => void
  ): () => void {
    const query: DocumentQuery<Doc> = {
      modifiedOn: { $gt: subscribe.lastTime },
      modifiedBy: { $ne: accountId },
      space: space
    }
    return client.query(_class, query, callback)
  }

  function queryNotification<T extends Doc> (
    _class: Ref<Class<T>>,
    space: Ref<Space>,
    callback: (result: T[]) => void
  ): () => void {
    const notify = (result: Array<Notification>): void => {
      const query: DocumentQuery<Doc> = {
        _id: { $in: result.map((p) => p.objectId) }
      }
      void client.findAll(_class, query).then((result) => {
        const res = result as FindResult<T>
        callback(res)
      })
    }

    return client.query(
      notification.class.Notification,
      {
        space: space,
        objectClass: _class,
        client: accountId
      },
      notify
    )
  }

  return {
    markAsRead,
    markAsReadObject,
    getSubscibeStatus,
    getObjectSubscibeStatus,
    subscribeObject,
    subscribeSpace,
    unsubscribeObject,
    unsubscribeSpace,
    spaceNotifications,
    objectNotifications
  }
}
