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
  import type { Ref, Space } from '@anticrm/core'
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
  import type { SpaceInfo, SpaceNotifications } from '@anticrm/notification'
  import notification from '@anticrm/notification'

  export let model: SpacesNavModel
  export let notifications: Map<Ref<Space>, SpaceNotifications>

  let spaces: Space[] = []
  let spaceInfo: Map<Ref<Space>, SpaceInfo> = new Map<Ref<Space>, SpaceInfo>()
  const client = getClient()
  const router = getRouter<WorkbenchRoute>()
  const accountId = client.accountId()
  let query: QueryUpdater<Space> | undefined

  $: {
    query = client.query(query, model.spaceClass, model.spaceQuery ?? {}, (result) => {
      const userSpace = buildUserSpace(accountId, model)
      spaces = [
        ...(userSpace === undefined ? [] : [userSpace]),
        ...result.filter((space) => space.members.includes(accountId))
      ]
    })
  }

  let lastModifiedQuery: QueryUpdater<SpaceInfo> | undefined
  $: if (spaces.length > 0) {
    lastModifiedQuery = client.query<SpaceInfo>(
      lastModifiedQuery,
      notification.class.SpaceInfo,
      { objectId: { $in: spaces.map((p) => p._id) } },
      (result) => {
        spaceInfo.clear()
        result.forEach((p) => spaceInfo.set(p.objectId as Ref<Space>, p))
        spaceInfo = spaceInfo
      }
    )
  }

  function toolActions (model: SpacesNavModel): Action[] {
    const result: Action[] = []
    const create = model.createComponent
    if (create !== undefined) {
      result.push({
        label: model.addSpaceLabel,
        icon: IconAdd,
        action: async (ev: MouseEvent): Promise<void> => {
          showPopup(create, {}, ev.target as HTMLElement)
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
</script>

<div>
  {#if !(model.hideIfEmpty ?? false) || spaces.length > 0}
    <TreeNode label={model.label} {actions}>
      {#each spaces as space}
        <TreeItem
          notifications={notifications.get(space._id)?.notificatedObjects.length ?? 0}
          changed={(notifications.get(space._id)?.lastRead ?? 0) < (spaceInfo.get(space._id)?.lastModified ?? 0)}
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
