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
  import type { Ref, Space, Data } from '@anticrm/core'
  import { Icon, ActionIcon } from '@anticrm/ui'
  import MoreH from './icons/MoreH.svelte'
  import Add from './icons/Add.svelte'
  import Star from './icons/Star.svelte'

  import { getClient } from '@anticrm/workbench'
  import core from '@anticrm/core'

  export let space: Ref<Space>

  let data: Data<Space> = {
    name: '',
    description: '',
    private: false
  }

  let unsubscribe = () => {}
  $: {
    unsubscribe()
    unsubscribe = getClient().query(core.class.Space, { _id: space }, result => { data = result[0] })
  }
</script>

<div class="header">
  <div class="caption">
    <div class="title">
      <span><Icon icon={'icon:chunter.Hashtag'} size={16}/></span>
      {data.name}
    </div>
    <div class="subtitle">{data.description}</div>
  </div>
  <div class="buttons">
    <div class="button"><ActionIcon icon={MoreH} size={16}/></div>
    <div class="button"><ActionIcon icon={Add} size={16}/></div>
    <div class="button"><ActionIcon icon={Star} size={16}/></div>
  </div>
</div>

<style lang="scss">
  .header {
    width: 100%;
    height: 72px;
    min-height: 72px;
    border-bottom: 1px solid var(--theme-menu-divider);
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 32px 0 40px;
    &.thread {
      width: auto;
      border-bottom: 1px solid transparent;
    }

    .caption {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      color: var(--theme-caption-color);

      .title {
        display: flex;
        align-items: center;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        font-size: 16px;
        font-weight: 500;

        span {
          width: 16px;
          height: 16px;
          margin-right: 8px;
        }
      }
      .subtitle {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        font-size: 12px;
        font-weight: 400;
        opacity: .3;
      }
    }

    .buttons {
      display: flex;
      flex-direction: row-reverse;
      margin-left: 24px;
      .button {
        width: 16px;
        height: 16px;
      }
      .button + .button {
        margin-right: 16px;
      }
    }
  }
</style>