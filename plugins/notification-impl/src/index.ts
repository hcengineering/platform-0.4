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
import { Ref, Class, Doc, Space, DocumentQuery, FindResult, Data } from '@anticrm/core'
import { getPlugin } from '@anticrm/platform'
import corePlugin, { Client } from '@anticrm/plugin-core'
import type { NotificationService, LastViewed, ObjectLastViewed, Notification } from '@anticrm/notification'
import notification from '@anticrm/notification'
import notificationPlugin from './plugin'

export { notificationPlugin }

export default async (): Promise<NotificationService> => {
  const coreP = await getPlugin(corePlugin.id)
  const client: Client = await coreP.getClient()
  const accountId = client.accountId()

  const markAsRead = async <T extends Doc>(objectClass: Ref<Class<T>>, space: Ref<Space>): Promise<void> => {
    const query = {
      objectClass: objectClass,
      space: space,
      client: accountId
    }
    // eslint-disable-next-line no-void
    void client.findAll(notification.class.LastViewed, query).then((subscribes) => {
      for (const subscribe of subscribes) {
        // eslint-disable-next-line no-void
        void client.updateDoc(subscribe._class, subscribe.space, subscribe._id, {
          lastTime: new Date().getTime()
        })
      }
    })
    // eslint-disable-next-line no-void
    void client.findAll(notification.class.ObjectLastViewed, query).then((subscribes) => {
      for (const subscribe of subscribes) {
        // eslint-disable-next-line no-void
        void client.updateDoc(subscribe._class, subscribe.space, subscribe._id, {
          lastTime: new Date().getTime()
        })
      }
    })
    // eslint-disable-next-line no-void
    void client.findAll(notification.class.Notification, query).then((subscribes) => {
      for (const subscribe of subscribes) {
        // eslint-disable-next-line no-void
        void client.removeDoc(subscribe._class, subscribe.space, subscribe._id)
      }
    })
  }

  const getSubscibeStatus = async <T extends Doc>(_class: Ref<Class<T>>, space: Ref<Space>): Promise<boolean> => {
    const subscribes = await client.findAll(notification.class.LastViewed, {
      objectClass: _class,
      space: space,
      client: accountId
    })
    const subscribe = subscribes.shift()
    return subscribe !== undefined
  }

  const getObjectSubscibeStatus = async <T extends Doc>(
    _class: Ref<Class<T>>,
    space: Ref<Space>,
    objectId: Ref<T>
  ): Promise<boolean> => {
    const subscribes = await client.findAll(notification.class.ObjectLastViewed, {
      objectClass: _class,
      space: space,
      client: accountId
    })
    const subscribe = subscribes.shift()
    if (subscribe == null) return false
    return subscribe.objectIDs.indexOf(objectId) !== -1
  }

  const subscribeSpace = async <T extends Doc>(_class: Ref<Class<T>>, space: Ref<Space>): Promise<void> => {
    const subscribes = await client.findAll(notification.class.LastViewed, {
      objectClass: _class,
      space: space,
      client: accountId
    })
    const subscribe = subscribes.shift()
    if (subscribe == null) {
      const obj: Data<LastViewed<T>> = {
        objectClass: _class,
        client: accountId,
        lastTime: new Date().getTime()
      }
      await client.createDoc(notification.class.LastViewed, space, obj)
    }
  }

  const subscribeObject = async <T extends Doc>(
    _class: Ref<Class<T>>,
    space: Ref<Space>,
    objectId: Ref<T>
  ): Promise<void> => {
    const subscribes = await client.findAll(notification.class.ObjectLastViewed, {
      objectClass: _class,
      space: space,
      client: accountId
    })
    const subscribe = subscribes.shift()
    if (subscribe == null) {
      const obj: Data<ObjectLastViewed<T>> = {
        objectClass: _class,
        client: accountId,
        lastTime: new Date().getTime(),
        objectIDs: [objectId]
      }
      await client.createDoc(notification.class.ObjectLastViewed, space, obj)
      return
    }

    if (subscribe.objectIDs.indexOf(objectId) === -1) {
      await client.updateDoc(subscribe._class, subscribe.space, subscribe._id, {
        $push: { objectIDs: objectId }
      })
    }
  }

  const unsubscribeSpace = async <T extends Doc>(_class: Ref<Class<T>>, space: Ref<Space>): Promise<void> => {
    const subscribes = await client.findAll(notification.class.LastViewed, {
      objectClass: _class,
      space: space,
      client: accountId
    })
    const subscribe = subscribes.shift()
    if (subscribe == null) return

    await client.removeDoc(subscribe._class, subscribe.space, subscribe._id)
  }

  const unsubscribeObject = async <T extends Doc>(
    _class: Ref<Class<T>>,
    space: Ref<Space>,
    objectId: Ref<T>
  ): Promise<void> => {
    const subscribes = await client.findAll(notification.class.ObjectLastViewed, {
      objectClass: _class,
      space: space,
      client: accountId
    })
    const subscribe = subscribes.shift()
    if (subscribe == null) return

    if (subscribe.objectIDs.indexOf(objectId) !== -1) {
      await client.updateDoc(subscribe._class, subscribe.space, subscribe._id, {
        $pull: { objectIDs: objectId }
      })
    }
  }

  const spaceNotifications = <T extends Doc>(
    _class: Ref<Class<T>>,
    space: Ref<Space>,
    callback: (result: T[]) => void
  ): (() => void) => {
    let objectSubscribe: () => void = () => {}
    const lastViewedSubscribe = client.query(
      notification.class.LastViewed,
      {
        objectClass: _class,
        space: space,
        client: accountId
      },
      (result) => {
        const lastViewed = result.shift()
        objectSubscribe()
        if (lastViewed != null) {
          objectSubscribe = querySpace(lastViewed as LastViewed<T>, _class, space, callback)
        } else {
          objectSubscribe = queryObjects(_class, space, callback)
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

  function querySpace<T extends Doc> (
    lastViewed: LastViewed<T>,
    _class: Ref<Class<T>>,
    space: Ref<Space>,
    callback: (result: T[]) => void
  ): () => void {
    const query: DocumentQuery<Doc> = {
      modifiedOn: { $gt: lastViewed.lastTime },
      modifiedBy: { $ne: accountId },
      space: space
    }
    return client.query(_class, query, callback)
  }

  function queryObjects<T extends Doc> (
    _class: Ref<Class<T>>,
    space: Ref<Space>,
    callback: (result: T[]) => void
  ): () => void {
    let objectSubscribe: () => void = () => {}
    const lastViewedSubscribe = client.query(
      notification.class.ObjectLastViewed,
      {
        objectClass: _class,
        space: space,
        client: accountId
      },
      (result) => {
        const lastViewed = result.shift()
        objectSubscribe()
        if (lastViewed != null) {
          objectSubscribe = queryObjectByIDs(lastViewed as ObjectLastViewed<T>, _class, space, callback)
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

  function queryObjectByIDs<T extends Doc> (
    lastViewed: ObjectLastViewed<T>,
    _class: Ref<Class<T>>,
    space: Ref<Space>,
    callback: (result: T[]) => void
  ): () => void {
    const query: DocumentQuery<Doc> = {
      modifiedOn: { $gt: lastViewed.lastTime },
      modifiedBy: { $ne: accountId },
      space: space,
      _id: { $in: lastViewed.objectIDs }
    }

    const callbackWithNotify = (result: T[]): void => {
      // eslint-disable-next-line no-void
      void client
        .findAll(notification.class.Notification, {
          space: space,
          objectClass: _class,
          client: accountId
        })
        .then((notifications) => {
          const objectIDs = notifications.map((p) => p.objectId)
          const query: DocumentQuery<Doc> = {
            _id: { $in: objectIDs }
          }
          // eslint-disable-next-line no-void
          void client.findAll(_class, query).then((notifyObjects) => {
            notifyObjects.concat(result.filter((p) => notifyObjects.find((n) => n._id === p._id) === undefined))
            const res = notifyObjects as FindResult<T>
            callback(res)
          })
        })
    }

    const notifyCallback = (result: T[]): void => {
      // eslint-disable-next-line no-void
      void client.findAll(_class, query).then((docs) => {
        const res = docs as FindResult<T>
        res.concat(result.filter((p) => res.find((n) => n._id === p._id) === undefined))
        callback(res)
      })
    }

    const notificationSubscribe = queryNotification(_class, space, notifyCallback)
    const objectSubscribe = client.query(_class, query, callbackWithNotify)
    const unsubscribes = (): void => {
      objectSubscribe()
      notificationSubscribe()
    }
    return unsubscribes
  }

  function queryNotification<T extends Doc> (
    _class: Ref<Class<T>>,
    space: Ref<Space>,
    callback: (result: T[]) => void
  ): () => void {
    const notify = (result: Array<Notification<T>>): void => {
      const query: DocumentQuery<Doc> = {
        _id: { $in: result.map((p) => p.objectId) }
      }
      // eslint-disable-next-line no-void
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
    getSubscibeStatus,
    getObjectSubscibeStatus,
    subscribeObject,
    subscribeSpace,
    unsubscribeObject,
    unsubscribeSpace,
    spaceNotifications
  }
}
