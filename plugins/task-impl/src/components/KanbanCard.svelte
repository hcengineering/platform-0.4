<!--
// Copyright © 2021 Anticrm Platform Contributors.
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
  import { ActionIcon, UserInfo } from '@anticrm/ui'
  import { Task } from '@anticrm/task'

  import MoreH from './icons/MoreH.svelte'
  import Chat from './icons/Chat.svelte'

  export let doc: Task
</script>

<div class="card-container">
  <div class="header">{doc.name}</div>
  <div class="footer">
    <div><UserInfo user="chen" avatarOnly={true} /></div>
    <div class="action">
      <ActionIcon size={24} icon={Chat} direction={'left'} label={'Comments'} />
      <div class="counter">{doc.comments.length}</div>
      <ActionIcon size={24} icon={MoreH} direction={'left'} label={'More...'} />
    </div>
  </div>
</div>

<style lang="scss">
  .card-container {
    display: flex;
    flex-direction: column;
    background-color: var(--theme-button-bg-hovered);
    border: 1px solid var(--theme-bg-accent-color);
    border-radius: 12px;

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 0;
      padding: 16px;
      height: 72px;
      min-height: 72px;
      background-color: var(--theme-button-bg-focused);
      border-radius: 11px 11px 0 0;
    }

    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 0;
      padding: 16px;
      height: 72px;
      min-height: 72px;
      background-color: var(--theme-button-bg-focused);
      border-radius: 11px 11px 0 0;

      .action {
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        align-items: center;

        .counter {
          margin-left: 4px;
          color: var(--theme-caption-color);
        }
      }

      div + div {
        margin-left: 16px;
      }
    }

    &.drag {
      opacity: 0.5;
    }
  }
</style>
