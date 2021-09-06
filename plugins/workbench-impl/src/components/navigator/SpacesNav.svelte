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
  import { getRouter } from '@anticrm/ui'
  import type { SpacesNavModel, WorkbenchRoute } from '@anticrm/workbench'
  import { getClient, showModal } from '@anticrm/workbench'
  import workbench from '../../plugin'
  import MoreH from '../icons/MoreH.svelte'
  import { buildUserSpace } from '../utils/space.utils'
  import TreeItem from './TreeItem.svelte'
  import TreeNode from './TreeNode.svelte'

  export let model: SpacesNavModel

  let spaces: Space[] = []
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

  function toolActions (model: SpacesNavModel): Action[] {
    const result: Action[] = []
    const create = model.createComponent
    if (create !== undefined) {
      result.push({
        label: model.addSpaceLabel,
        icon: IconAdd,
        action: async (): Promise<void> => {
          showModal(create, {})
        }
      })
    }
    result.push({
      label: model.label,
      icon: MoreH,
      action: async (): Promise<void> => {
        showModal(workbench.component.Spaces, {
          _class: model.spaceClass,
          spaceQuery: model.spaceQuery ?? {},
          label: model.label
        })
      }
    })
    return result
  }

  $: actions = toolActions(model)

  function selectSpace (id: Ref<Space>) {
    router.navigate({ space: id, itemId: undefined })
  }
</script>

<div>
  <!-- {#if !(model.hideIfEmpty ?? false) || spaces.length > 0} -->
  <TreeNode label={model.label} {actions}>
    {#each spaces as space}
      <TreeItem
        notifications={5}
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
  <!-- {/if} -->
</div>
