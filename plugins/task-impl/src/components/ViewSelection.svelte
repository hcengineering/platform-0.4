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
  import { Tooltip } from '@anticrm/ui'
  import VCard from './icons/VCard.svelte'
  import VList from './icons/VList.svelte'
  import VKanban from './icons/VKanban.svelte'

  export let views: Array<Object> = [{ icon: VList, name: 'list' },
                                     { icon: VCard, name: 'card' },
                                     { icon: VKanban, name: 'kanban' }]
  export let selected: string = 'card'
</script>

<div class="viewSelection-container">
  {#each views as view}
    <Tooltip label={view.name}>
      <div class="button" class:selected={selected === view.name} on:click={() => { selected = view.name }}>
        <div class="icon"><svelte:component this={view.icon} size={16}/></div>
      </div>
    </Tooltip>
  {/each}
</div>

<style lang="scss">
  .viewSelection-container {
    display: flex;
    flex-direction: row;
    height: 32px;

    .button {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background-color: transparent;
      cursor: pointer;

      .icon {
        width: 16px;
        height: 16px;
        opacity: .2;
      }

      &:hover .icon {
        opacity: 1;
      }

      &.selected {
        background-color: var(--theme-button-bg-enabled);
        cursor: default;
        .icon {
          opacity: .8;
        }
      }
    }
  }
</style>
