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

import type { Class, Doc, DerivedData, DocumentMapper, Ref, Timestamp, DerivedDataDescriptor } from '@anticrm/core'
import type { Plugin, Service } from '@anticrm/platform'
import { plugin } from '@anticrm/platform'
import type { Resource } from '@anticrm/status'
import type { PresentationClient } from '@anticrm/presentation'
import copy from 'fast-copy'

export interface SpaceNotifications extends DerivedData {
  lastRead: Timestamp
  objectLastReads: Map<Ref<Doc>, Timestamp>
  notificatedObjects: Array<Ref<Doc>>
}

export interface SpaceInfo extends DerivedData {
  lastModified: Timestamp
}

export interface NotificationService extends Service {}

export class NotificationClient {
  private lastPosition = 0
  private lastTime = 0
  private waitingUpdate = false
  private autoscroll = false
  private prevId: Ref<Doc> | undefined
  private prevNotifications: SpaceNotifications | undefined

  constructor (private readonly client: PresentationClient) {}

  public async before (
    div: HTMLElement,
    notifications: SpaceNotifications,
    id: Ref<Doc> | undefined,
    isObject: boolean
  ): Promise<void> {
    if (id !== this.prevId) {
      if (this.waitingUpdate && this.prevId !== undefined && this.prevNotifications != null) {
        await this.updateLastRead(notifications, isObject ? this.prevId : undefined)
      }
      this.prevId = id
      this.prevNotifications = copy(notifications)
      this.lastPosition = 0
      this.lastTime = 0
      this.autoscroll = false
    } else {
      this.lastPosition = div.scrollTop
    }
  }

  public async readNow (notifications: SpaceNotifications, id?: Ref<Doc>): Promise<void> {
    this.lastTime = Date.now()
    await this.updateLastRead(notifications, id)
  }

  public initScroll (div: HTMLElement, lastRead: number, offset: boolean): void {
    if (this.autoscroll) {
      div.scrollTo(0, div.scrollHeight)
      return
    }
    if (this.lastPosition > 0) {
      div.scrollTo(0, this.lastPosition)
      return
    }
    if (lastRead > 0) {
      const messages = div.getElementsByClassName('message')
      let firstNewMessage: HTMLElement | undefined
      for (let i = offset ? 1 : 0; i < messages.length; i++) {
        const elem = messages[i] as HTMLElement
        if (elem === undefined) continue
        const modified = elem.dataset.lastmodified
        if (modified !== undefined && parseInt(modified) > lastRead) {
          firstNewMessage = elem
          break
        }
      }
      if (firstNewMessage !== undefined) {
        firstNewMessage.scrollIntoView(false)
        return
      }
    }
    div.scrollTo(0, div.scrollHeight)
  }

  public scrollHandler (
    div: HTMLElement,
    notifications: SpaceNotifications | undefined,
    lastRead: number,
    offset: boolean,
    id?: Ref<Doc>
  ): void {
    if (notifications === undefined) return
    this.lastPosition = div.scrollTop
    const messages = div.getElementsByClassName('message')
    const divBottom = div.getBoundingClientRect().bottom
    for (let i = offset ? 1 : 0; i < messages.length; i++) {
      const elem = messages[i] as HTMLElement
      if (elem.getBoundingClientRect().bottom > divBottom) break
      const modified = elem.dataset.modified
      if (modified === undefined) continue
      const messageModified = parseInt(modified)
      this.lastTime = messageModified > this.lastTime ? messageModified : this.lastTime
    }
    if (this.lastTime > lastRead) {
      if (!this.waitingUpdate) {
        this.waitingUpdate = true
        setTimeout(() => this.updateLastRead(notifications, id), 3000)
      }
    }
  }

  public setAutoscroll (div: HTMLElement): void {
    this.autoscroll = this.lastPosition > 0 ? this.lastPosition > div.scrollHeight - div.clientHeight - 30 : false
  }

  private async updateLastRead (notifications: SpaceNotifications, id?: Ref<Doc>): Promise<void> {
    if (notifications === undefined) return
    if (id === undefined) {
      await this.client.updateDoc<SpaceNotifications>(notifications._class, notifications.space, notifications._id, {
        lastRead: this.lastTime
      })
    } else {
      if (notifications.objectLastReads.set === undefined) {
        notifications.objectLastReads = new Map<Ref<Doc>, Timestamp>()
      }
      notifications.objectLastReads.set(id, this.lastTime)
      await this.client.updateDoc(notifications._class, notifications.space, notifications._id, {
        objectLastReads: notifications.objectLastReads
      })
    }
    this.waitingUpdate = false
  }
}

const notificationPlugin = 'notification' as Plugin<NotificationService>

export default plugin(
  notificationPlugin,
  {},
  {
    class: {
      SpaceNotifications: '' as Ref<Class<SpaceNotifications>>,
      SpaceInfo: '' as Ref<Class<SpaceInfo>>
    },
    mappers: {
      SpaceInfo: '' as Resource<DocumentMapper>,
      SpaceNotification: '' as Resource<DocumentMapper>
    },
    dd: {
      SpaceInfo: '' as Ref<DerivedDataDescriptor<Doc, Doc>>,
      SpaceNotifications: '' as Ref<DerivedDataDescriptor<Doc, Doc>>
    }
  }
)
