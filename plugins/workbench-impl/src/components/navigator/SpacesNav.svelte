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
  import type { Ref, Space, Account } from '@anticrm/core'
  import core from '@anticrm/core'
  import { getCurrentLocation, IconAdd, navigate } from '@anticrm/ui'
  import type { Action } from '@anticrm/ui'
  import { getClient, showModal } from '@anticrm/workbench'
  import type { SpacesNavModel } from '@anticrm/workbench'
  import workbench from '../../plugin'
  import TreeItem from './TreeItem.svelte'
  import TreeNode from './TreeNode.svelte'
  import Search from '../icons/Search.svelte'
  import type { QueryUpdater } from '@anticrm/presentation'
  import avatar from '../../../img/avatar.png'

  export let model: SpacesNavModel

  let spaces: Space[] = []
  const client = getClient()
  const accountId = client.accountId()
  let query: QueryUpdater<Space> | undefined

  $: {
    query = client.query(query, model.spaceClass, model.spaceQuery ?? {}, (result) => {
      spaces = result.filter((space) => space.members.includes(accountId))
    })
  }

  $: addSpace = {
    label: model.addSpaceLabel,
    icon: IconAdd,
    action: async (): Promise<void> => {
      showModal(model.createComponent, {})
    }
  }

  const joinSpace: Action = {
    label: model.label,
    icon: Search,
    action: async (): Promise<void> => {
      showModal(workbench.component.Spaces, { _class: model.spaceClass, spaceQuery: model.spaceQuery ?? {}, label: model.label })
    }
  }

  function selectSpace (id: Ref<Space>) {
    const loc = getCurrentLocation()
    loc.path[2] = id
    loc.path.length = 3
    navigate(loc)
  }
  async function getUser (space: Space): Promise<Account> {
    const curAcc = client.accountId()
    return (await client.findAll(core.class.Account, { _id: { $in: space.members } })).filter(acc => acc._id !== curAcc).shift()
  }
</script>

<div>
  <TreeNode label={model.label} actions={[addSpace, joinSpace]}>
    {#each spaces as space}
      {#if model.showUsers}
        {#await getUser(space) then spUser }
          <TreeItem
          title={spUser.name}
          icon={spUser.avatar ?? avatar}
          on:click={() => {
            selectSpace(space._id)
          }}
        />  
        {/await}
      {:else}
        <TreeItem
          title={space.name}
          icon={model.spaceIcon}
          on:click={() => {
            selectSpace(space._id)
          }}
        />
      {/if}
    {/each}
  </TreeNode>
</div>
