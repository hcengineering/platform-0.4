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
  import { Space } from '@anticrm/core'
  import ui, { ActionIcon, Button, Component, Icon, showPopup } from '@anticrm/ui'
  import type { SpacesNavModel } from '@anticrm/workbench'
  import { getClient } from '@anticrm/workbench'
  import MoreH from './icons/MoreH.svelte'
  import Star from './icons/Star.svelte'

  export let space: Space | undefined
  export let spaceModel: SpacesNavModel | undefined

  const client = getClient()

  const addAction = (ev: MouseEvent) => {
    if (spaceModel?.item?.createComponent !== undefined) {
      showPopup(spaceModel.item.createComponent, { space }, ev.target as HTMLElement)
    }
  }
  const changeStarred = () => {
    if (space !== undefined) {
      if (space.account === undefined) {
        space.account = {
          starred: true
        }
      } else {
        space.account.starred = !space.account.starred
      }
      client.updateDoc<Space>(
        space._class,
        space.space,
        space._id,
        {
          account: space.account
        },
        true
      )
    }
  }
</script>

<div class="flex-between header">
  <div class="flex-col caption">
    {#if spaceModel && spaceModel.spaceHeader}
      {#if space}
        <Component is={spaceModel.spaceHeader} props={{ space: space }} />
      {/if}
    {:else}
      <div class="dotted-text title">
        {#if spaceModel}
          <span>
            {#if space}
              <Icon icon={spaceModel.spaceIcon} size={16} />
            {/if}
          </span>
          {#if space}{space.name}{/if}
        {/if}
      </div>
      <div class="dotted-text subtitle">
        {#if space}{space.description}{/if}
      </div>
    {/if}
  </div>
  <div class="flex-row-center">
    <Button
      label={spaceModel?.item?.createLabel ?? ui.string.Create}
      size={'small'}
      primary
      on:click={(ev) => {
        addAction(ev)
      }}
    />
    <div class="button button-8">
      <ActionIcon icon={Star} size={16} action={changeStarred} filled={space?.account?.starred ?? false} />
    </div>
    <div class="button button-4"><ActionIcon icon={MoreH} size={16} /></div>
  </div>
</div>

<style lang="scss">
  .header {
    height: 72px;
    min-height: 72px;
    border-bottom: 1px solid var(--theme-menu-divider);
    padding: 0 24px 0 40px;

    .caption {
      flex-grow: 1;
      color: var(--theme-caption-color);

      .title {
        display: flex;
        align-items: center;
        font-size: 16px;
        font-weight: 500;

        span {
          width: 16px;
          height: 16px;
          margin-right: 8px;
        }
      }
      .subtitle {
        font-size: 12px;
        font-weight: 400;
        opacity: 0.3;
      }
    }

    .button {
      margin-left: 8px;
    }
    .button-8 {
      padding: 8px;
    }
    .button-4 {
      padding: 4px;
    }
  }
</style>
