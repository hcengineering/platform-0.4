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
  import { onDestroy } from 'svelte'

  import type { Asset } from '@anticrm/status'
  import type { Space } from '@anticrm/core'
  import type { SpacesNavModel } from '@anticrm/workbench'
  import type { Action } from '@anticrm/ui'

  import { showModal, IconAdd } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'

  import TreeNode from './TreeNode.svelte'
  import TreeItem from './TreeItem.svelte'

  export let model: SpacesNavModel

  let spaces: Space[] = []
  let unsubscribe = () => {}

  $: {
    unsubscribe()
    unsubscribe = getClient().query(model.spaceClass, {}, result => { spaces = result })
  }

  onDestroy(() => { unsubscribe() })

  const addSpace: Action = {
    label: model.addSpaceLabel,
    icon: IconAdd,
    action: async (): Promise<void> => {
      console.log('the action')
      showModal(model.createComponent, {})
    }
  }
</script>

<div>
  <TreeNode label={model.label} actions={[addSpace]}>
    {#each spaces as space}
      <TreeItem title={space.name} icon={model.spaceIcon}/>
    {/each}
  </TreeNode>
</div>
