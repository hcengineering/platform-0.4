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
  import { Doc, Ref, Space, Timestamp } from '@anticrm/core'
  import type { QueryUpdater } from '@anticrm/presentation'
  import type { Action } from '@anticrm/ui'
  import { IconAdd } from '@anticrm/ui'
  import { getRouter, showPopup } from '@anticrm/ui'
  import type { SpacesNavModel, WorkbenchRoute } from '@anticrm/workbench'
  import { getClient } from '@anticrm/workbench'
  import workbench from '../../plugin'
  import MoreH from '../icons/MoreH.svelte'
  import { buildUserSpace } from '../utils/space.utils'
  import TreeItem from './TreeItem.svelte'
  import TreeNode from './TreeNode.svelte'
  import {
    NotificationClient,
    SpaceLastViews,
    SpaceSubscribeUpdater,
    ObjectSubscribeUpdater
  } from '@anticrm/notification'
  import { onDestroy } from 'svelte'

  export let model: SpacesNavModel
  export let spacesLastViews: Map<Ref<Space>, SpaceLastViews>

  let spaces: Space[] = []
  const client = getClient()
  const notificationClient = NotificationClient.get(client)
  const router = getRouter<WorkbenchRoute>()
  const accountId = client.accountId()
  let query: QueryUpdater<Space> | undefined
  let spacesLastModified: Map<Ref<Space>, Timestamp> = new Map<Ref<Space>, Timestamp>()
  let itemsLastModifieds: Map<Ref<Doc>, Timestamp> = new Map<Ref<Doc>, Timestamp>()
  let spacesSubscribe: SpaceSubscribeUpdater | undefined
  let itemsSubscribe: ObjectSubscribeUpdater | undefined
  let prevModel: SpacesNavModel | undefined

  $: if (model !== prevModel) {
    prevModel = model
    query = client.query(query, model.spaceClass, model.spaceQuery ?? {}, (result) => {
      const userSpace = buildUserSpace(accountId, model)
      spaces = [
        ...(userSpace === undefined ? [] : [userSpace]),
        ...result.filter((space) => space.members.includes(accountId))
      ]
      if (model.notification?.spaceClass !== undefined) {
        const targetClass = model.notification?.spaceClass
        spacesSubscribe = notificationClient.subscribeSpaces(
          spacesSubscribe,
          spaces.map((s) => s._id),
          targetClass,
          (res) => {
            spacesLastModified = res
          }
        )
      }
    })
  }

  $: if (model.notification?.itemByIdClass !== undefined) {
    const ids: Ref<Doc>[] = []
    spacesLastViews.forEach((v) => {
      if (v.objectLastReads instanceof Map) {
        ids.push(...Array.from(v.objectLastReads.keys()))
      }
    })
    if (ids.length > 0) {
      const targetClass = model.notification.itemByIdClass
      itemsSubscribe = notificationClient.subscribeObjects(
        itemsSubscribe,
        ids,
        targetClass,
        (res) => {
          itemsLastModifieds = res
        },
        model.notification.itemByIdField
      )
    }
  }

  function toolActions (model: SpacesNavModel): Action[] {
    const result: Action[] = []
    const create = model.createComponent
    if (create !== undefined) {
      result.push({
        label: model.addSpaceLabel,
        icon: IconAdd,
        action: async (): Promise<void> => {
          showPopup(create, {}, 'right')
        }
      })
    }
    result.push({
      label: model.label,
      icon: MoreH,
      action: async (): Promise<void> => {
        showPopup(
          workbench.component.Spaces,
          {
            _class: model.spaceClass,
            spaceQuery: model.spaceQuery ?? {},
            label: model.label
          },
          'right'
        )
      }
    })
    return result
  }

  $: actions = toolActions(model)

  function selectSpace (id: Ref<Space>) {
    router.navigate({ space: id, special: undefined })
  }

  function hasNotification (space: Ref<Space>, spacesLastViews: Map<Ref<Space>, SpaceLastViews>): number {
    return spacesLastViews.get(space)?.notificatedObjects.length ?? 0
  }

  function changed (
    space: Ref<Space>,
    spacesLastViews: Map<Ref<Space>, SpaceLastViews>,
    spacesLastModified: Map<Ref<Space>, Timestamp>,
    itemsLastModifieds: Map<Ref<Doc>, Timestamp>
  ): boolean {
    const spaceLastViews = spacesLastViews.get(space)
    if (spaceLastViews === undefined) return false
    if (spaceLastViews.notificatedObjects.length > 0) return true
    if ((spacesLastModified.get(space) ?? 0) > spaceLastViews.lastRead) return true
    if (spaceLastViews.objectLastReads instanceof Map) {
      for (const object of spaceLastViews.objectLastReads) {
        const id = object[0]
        const lastRead = object[1]
        const lastModified = itemsLastModifieds.get(id)
        if (lastModified !== undefined) {
          if (lastModified > lastRead) return true
        }
      }
    }
    return false
  }

  onDestroy(() => {
    spacesSubscribe?.unsubscribe()
    itemsSubscribe?.unsubscribe()
  })
</script>

<div>
  {#if !(model.hideIfEmpty ?? false) || spaces.length > 0}
    <TreeNode label={model.label} {actions}>
      {#each spaces as space (space._id)}
        <TreeItem
          notifications={hasNotification(space._id, spacesLastViews)}
          changed={changed(space._id, spacesLastViews, spacesLastModified, itemsLastModifieds)}
          component={model.spaceItem}
          props={{ space: space }}
          title={space.name}
          icon={model.spaceIcon}
          on:click={() => {
            selectSpace(space._id)
          }}
        />
      {/each}
    </TreeNode>
  {/if}
</div>
