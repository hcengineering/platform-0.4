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
  import { EditBox } from '@anticrm/ui'
  import MoreH from './icons/MoreH.svelte'
  import Add from './icons/Add.svelte'

  export let title: string
</script>

<div class="header">
  <div class="title">{title}</div>
  <div class="buttons">
    <div class="button"><MoreH size={16}/></div>
    <div class="button"><Add size={16}/></div>
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

    .title {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      font-size: 16px;
      font-weight: 500;
      flex-grow: 1;
    }
    .buttons {
      display: flex;
      flex-direction: row-reverse;
      margin-left: 24px;
      .button {
        width: 16px;
        height: 16px;
        opacity: .3;
        cursor: pointer;
        &:hover {
          opacity: 1;
        }
      }
      .button + .button {
        margin-right: 16px;
      }
    }
  }
</style>