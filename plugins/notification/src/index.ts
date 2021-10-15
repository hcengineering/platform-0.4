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

import {
  Class,
  Doc,
  DerivedData,
  DerivedDataDescriptor,
  DocumentMapper,
  DocumentUpdate,
  Ref,
  Timestamp,
  TxOperations,
  Tx,
  Space,
  Storage,
  SortingOrder,
  generateId,
  ObjectTx
} from '@anticrm/core'
import type { Plugin, Service } from '@anticrm/platform'
import { plugin } from '@anticrm/platform'
import type { Resource } from '@anticrm/status'
import copy from 'fast-copy'
import { deepEqual } from 'fast-equals'

export interface SpaceLastViews extends DerivedData {
  lastRead: Timestamp
  objectLastReads: Map<Ref<Doc>, Timestamp>
  notificatedObjects: Array<Ref<Doc>>
}

export interface NotificationService extends Service {}

let instance: NotificationClient | undefined

interface SpaceSubscribe {
  targetClass: Ref<Class<Doc>>
  spaces: Map<Ref<Space>, Promise<Timestamp> | Timestamp>
  callback: (lastModified: Map<Ref<Space>, Timestamp>) => void
}

interface ObjectSubscribe {
  targetField: string
  objects: Map<Ref<Doc>, Timestamp | Timestamp> | Promise<Map<Ref<Doc>, Timestamp | Timestamp>>
  callback: (lastModified: Map<Ref<Doc>, Timestamp>) => void
}
type UnsubscribeFunc = () => void

export class SpaceNotification {
  oldSpaces?: Array<Ref<Space>>
  oldTargetClass?: Ref<Class<Doc>>
  unsubscribe?: UnsubscribeFunc

  constructor (
    private readonly client: Storage & TxOperations,
    private readonly callback: (map: Map<Ref<Space>, Timestamp>) => void
  ) {}

  update (spaces: Array<Ref<Space>>, targetClass: Ref<Class<Doc>>, spaceSubscribes: Map<string, SpaceSubscribe>): void {
    if (this.checkParams(spaces, targetClass)) {
      return
    }

    this.unsubscribe?.()
    this.oldSpaces = spaces
    this.oldTargetClass = targetClass
    const subscribe = {
      _id: generateId(),
      callback: this.callback,
      targetClass,
      spaces: new Map(
        spaces.map((s) => [
          s,
          this.client
            .findAll(targetClass, { space: s }, { limit: 1, sort: { modifiedOn: SortingOrder.Descending } })
            .then((p) => p.shift()?.modifiedOn ?? 0)
        ])
      )
    }
    void awaitResults(subscribe.spaces).then((p) => subscribe.callback(p)) // eslint-disable-line no-void
    spaceSubscribes.set(subscribe._id, subscribe)
    this.unsubscribe = () => {
      spaceSubscribes.delete(subscribe._id)
    }
  }

  private checkParams (spaces: Array<Ref<Space>>, targetClass: Ref<Class<Doc>>): boolean {
    return deepEqual(this.oldSpaces, spaces) && this.oldTargetClass === targetClass
  }
}

export interface SpaceSubscribeUpdater {
  update: (spaces: Array<Ref<Space>>, targetClass: Ref<Class<Doc>>) => void
  unsubscribe: () => void
}

export class ObjectNotification {
  oldIds?: Array<Ref<Doc>>
  oldTargetClass?: Ref<Class<Doc>>
  oldTargetField?: string
  unsubscribe?: UnsubscribeFunc

  constructor (
    private readonly client: Storage & TxOperations,
    private readonly callback: (map: Map<Ref<Doc>, Timestamp>) => void
  ) {}

  update (
    ids: Array<Ref<Doc>>,
    targetClass: Ref<Class<Doc>>,
    objectSubscribes: Map<string, ObjectSubscribe>,
    _targetField?: string
  ): void {
    const targetField = _targetField ?? 'modifiedBy'
    if (this.checkParams(ids, targetClass, targetField)) {
      return
    }

    this.unsubscribe?.()
    this.oldIds = ids
    this.oldTargetClass = targetClass
    this.oldTargetField = targetField
    const objects = this.client.findAll(targetClass, { _id: { $in: ids } }).then((r) => {
      return new Map(r.map((d) => [d._id, (d as any)[targetField]]))
    })
    const subscribe = {
      _id: generateId(),
      targetField,
      callback: this.callback,
      objects
    }
    void objects.then((p) => subscribe.callback(p)) // eslint-disable-line no-void
    objectSubscribes.set(subscribe._id, subscribe)
    this.unsubscribe = () => {
      objectSubscribes.delete(subscribe._id)
    }
  }

  private checkParams (ids: Array<Ref<Doc>>, targetClass: Ref<Class<Doc>>, targetField?: string): boolean {
    return deepEqual(this.oldIds, ids) && this.oldTargetClass === targetClass && targetField === this.oldTargetField
  }
}

export interface ObjectSubscribeUpdater {
  update: (ids: Array<Ref<Doc>>, targetClass: Ref<Class<Doc>>, _targetField?: string) => void
  unsubscribe: () => void
}

export class NotificationClient {
  private lastPosition = 0
  private lastTime = 0
  private timeoutId: number | undefined
  private autoscroll = false
  private prevId: Ref<Doc> | undefined
  private prevLastViews: SpaceLastViews | undefined
  private readonly readObjects: Set<Ref<Doc>> = new Set<Ref<Doc>>()

  private readonly spaceSubscribes: Map<string, SpaceSubscribe> = new Map<string, SpaceSubscribe>()
  private readonly objectSubscribes: Map<string, ObjectSubscribe> = new Map<string, ObjectSubscribe>()

  private constructor (private readonly client: Storage & TxOperations) {}

  public static get (client: Storage & TxOperations): NotificationClient {
    if (instance === undefined) {
      instance = new NotificationClient(client)
    }
    return instance
  }

  public async tx (tx: Tx): Promise<void> {
    this.spaceSubscribes.forEach((p) => {
      void updateSpace(tx, p) // eslint-disable-line no-void
    })
    this.objectSubscribes.forEach((p) => {
      void updateObject(tx, p) // eslint-disable-line no-void
    })
  }

  public subscribeSpaces (
    subscribe: SpaceSubscribeUpdater | undefined,
    spaces: Array<Ref<Space>>,
    targetClass: Ref<Class<Doc>>,
    callback: (map: Map<Ref<Space>, Timestamp>) => void
  ): SpaceSubscribeUpdater {
    if (subscribe !== undefined) {
      subscribe.update(spaces, targetClass)
      return subscribe
    }
    return this.spaceQuery(spaces, targetClass, callback)
  }

  private spaceQuery (
    spaces: Array<Ref<Space>>,
    targetClass: Ref<Class<Doc>>,
    callback: (map: Map<Ref<Space>, Timestamp>) => void
  ): SpaceSubscribeUpdater {
    const lQuery = new SpaceNotification(this.client, callback)
    lQuery.update(spaces, targetClass, this.spaceSubscribes)

    return {
      update: (spaces, targetClass) => lQuery.update(spaces, targetClass, this.spaceSubscribes),
      unsubscribe: () => {
        lQuery.unsubscribe?.()
      }
    }
  }

  public subscribeObjects (
    subscribe: ObjectSubscribeUpdater | undefined,
    ids: Array<Ref<Doc>>,
    targetClass: Ref<Class<Doc>>,
    callback: (map: Map<Ref<Doc>, Timestamp>) => void,
    targetField?: string
  ): ObjectSubscribeUpdater {
    if (subscribe !== undefined) {
      subscribe.update(ids, targetClass, targetField)
      return subscribe
    }
    return this.objectQuery(ids, targetClass, callback, targetField)
  }

  private objectQuery (
    ids: Array<Ref<Doc>>,
    targetClass: Ref<Class<Doc>>,
    callback: (map: Map<Ref<Doc>, Timestamp>) => void,
    targetField?: string
  ): ObjectSubscribeUpdater {
    const lQuery = new ObjectNotification(this.client, callback)
    lQuery.update(ids, targetClass, this.objectSubscribes, targetField)

    return {
      update: (spaces, targetClass) => lQuery.update(spaces, targetClass, this.objectSubscribes, targetField),
      unsubscribe: () => {
        lQuery.unsubscribe?.()
      }
    }
  }

  public async before (
    div: HTMLElement,
    lastViews: SpaceLastViews,
    id: Ref<Doc> | undefined,
    isObject: boolean
  ): Promise<void> {
    if (id !== this.prevId) {
      if (this.timeoutId !== undefined && this.prevId !== undefined && this.prevLastViews != null) {
        await this.updateLastRead(this.prevLastViews, isObject ? this.prevId : undefined)
      }
      this.prevId = id
      this.prevLastViews = copy(lastViews)
      this.lastPosition = 0
      this.lastTime = 0
      this.autoscroll = false
    } else {
      this.lastPosition = div.scrollTop
    }
  }

  public async readNow (lastView: SpaceLastViews, id?: Ref<Doc>): Promise<void> {
    this.lastTime = Date.now()
    await this.updateLastRead(lastView, id, true)
  }

  public initScroll (div: HTMLElement, lastRead: number): void {
    if (div == null) {
      throw new Error('div should be defined')
    }
    if (this.autoscroll) {
      div.scrollTo(0, div.scrollHeight)
      return
    }
    if (this.lastPosition > 0) {
      div.scrollTo(0, this.lastPosition)
      return
    }
    if (lastRead > 0) {
      const containers = div.getElementsByClassName('isNew')
      const elem = containers[0] as HTMLElement
      if (elem !== undefined) {
        elem.scrollIntoView(false)
        return
      }
    }
    div.scrollTo(0, div.scrollHeight)
  }

  public scrollHandler (div: HTMLElement, spaceLastViews: SpaceLastViews | undefined, id?: Ref<Doc>): void {
    if (spaceLastViews === undefined) return
    const lastRead = id === undefined ? spaceLastViews.lastRead : spaceLastViews.objectLastReads.get(id) ?? 0
    this.lastPosition = div.scrollTop
    const newObjects = div.getElementsByClassName('isNew')
    const divBottom = div.getBoundingClientRect().bottom
    for (let i = 0; i < newObjects.length; i++) {
      const elem = newObjects[i] as HTMLElement
      if (elem.getBoundingClientRect().bottom > divBottom + 10) break
      this.readObject(spaceLastViews, elem.dataset)
      if (i === newObjects.length - 1) {
        this.lastTime = Date.now()
      }
    }
    if (this.lastTime > lastRead) {
      if (this.timeoutId === undefined) {
        this.timeoutId = setTimeout(async () => await this.updateLastRead(spaceLastViews, id), 2000)
      }
    }
  }

  public setAutoscroll (div: HTMLElement): void {
    this.autoscroll = this.lastPosition > 0 ? this.lastPosition > div.scrollHeight - div.clientHeight - 30 : false
  }

  private readObject (lastView: SpaceLastViews, dataset: DOMStringMap): void {
    if (dataset.id !== undefined) {
      const id = dataset.id as Ref<Doc>
      if (lastView.notificatedObjects.includes(id)) {
        this.readObjects.add(id)
      }
    }
    if (dataset.created !== undefined) {
      const created = parseInt(dataset.created)
      this.lastTime = created > this.lastTime ? created : this.lastTime
    }
  }

  private async updateLastRead (lastViews: SpaceLastViews, id?: Ref<Doc>, create: boolean = false): Promise<void> {
    if (lastViews === undefined) return
    const query: DocumentUpdate<SpaceLastViews> = {}
    if (id === undefined) {
      query.lastRead = this.lastTime
    } else {
      if (!(lastViews.objectLastReads instanceof Map)) {
        lastViews.objectLastReads = new Map<Ref<Doc>, Timestamp>()
      }
      if (lastViews.objectLastReads.has(id) || create) {
        lastViews.objectLastReads.set(id, this.lastTime)
      }
      query.objectLastReads = lastViews.objectLastReads
    }
    if (this.readObjects.size > 0) {
      query.$pull = {
        notificatedObjects: { $in: Array.from(this.readObjects) }
      }
    }
    clearTimeout(this.timeoutId)
    this.timeoutId = undefined
    await this.client.updateDoc(lastViews._class, lastViews.space, lastViews._id, query)
  }
}

async function awaitValue<T> (value: T | Promise<T>): Promise<T> {
  if (value instanceof Promise) {
    return await value
  }
  return value
}

async function awaitResults (
  objects: Map<Ref<Space>, Promise<Timestamp> | Timestamp>
): Promise<Map<Ref<Space>, Timestamp>> {
  const res: Map<Ref<Space>, Timestamp> = new Map<Ref<Space>, Timestamp>()
  for await (const object of objects) {
    let val = object[1]
    val = await awaitValue(val)
    res.set(object[0], val)
  }
  return res
}

async function updateSpace (tx: Tx, subscribe: SpaceSubscribe): Promise<void> {
  if ((tx as ObjectTx<Doc>)?.objectClass !== subscribe.targetClass) return
  let lastModified = subscribe.spaces.get(tx.objectSpace)
  if (lastModified !== undefined) {
    lastModified = await awaitValue(lastModified)
    if (tx.modifiedOn > lastModified) {
      subscribe.spaces.set(tx.objectSpace, tx.modifiedOn)
      void awaitResults(subscribe.spaces).then((res) => subscribe.callback(res)) // eslint-disable-line no-void
    }
  }
}

async function updateObject (tx: Tx, subscribe: ObjectSubscribe): Promise<void> {
  subscribe.objects = await awaitValue(subscribe.objects)
  const modified = subscribe.objects.get(tx.objectId)
  if (modified !== undefined) {
    const target = (tx as any)[subscribe.targetField]
    if (target > modified) {
      subscribe.objects.set(tx.objectId, target)
      subscribe.callback(subscribe.objects)
    }
  }
}

const notificationPlugin = 'notification' as Plugin<NotificationService>

export default plugin(
  notificationPlugin,
  {},
  {
    class: {
      SpaceLastViews: '' as Ref<Class<SpaceLastViews>>
    },
    mappers: {
      SpaceLastViews: '' as Resource<DocumentMapper>
    },
    dd: {
      SpaceLastViews: '' as Ref<DerivedDataDescriptor<Doc, Doc>>
    }
  }
)
