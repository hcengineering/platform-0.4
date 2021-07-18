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
  import { Action, getCurrentLocation, IconAdd, navigate } from '@anticrm/ui'
  import type { SpacesNavModel } from '@anticrm/workbench'
  import { getClient, showModal } from '@anticrm/workbench'
  import { onDestroy } from 'svelte'
  import TreeItem from './TreeItem.svelte'
  import TreeNode from './TreeNode.svelte'

  export let model: SpacesNavModel
  export let space: Ref<Space>

  let spaces: Space[] = []
  let unsubscribe = () => {}

  $: {
    unsubscribe()
    unsubscribe = getClient().query(model.spaceClass, {}, (result) => {
      spaces = result
    })
  }

  onDestroy(unsubscribe)

  const addSpace: Action = {
    label: model.addSpaceLabel,
    icon: IconAdd,
    action: async (): Promise<void> => {
      showModal(model.createComponent, {})
    }
  }

  function selectSpace (id: Ref<Space>) {
    const loc = getCurrentLocation()
    loc.path[2] = id
    loc.path.length = 3
    navigate(loc)
  }
</script>

<div>
  <TreeNode label={model.label} actions={[addSpace]}>
    {#each spaces as space}
      <TreeItem
        title={space.name}
        icon={model.spaceIcon}
        on:click={() => {
          selectSpace(space._id)
        }}
      />
    {/each}
  </TreeNode>
</div>
