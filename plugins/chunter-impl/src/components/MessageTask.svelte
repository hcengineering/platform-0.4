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
  import { CheckBoxList, UserInfo, ActionIcon, IconMoreV } from '@anticrm/ui'
  import type { CheckListItem } from '@anticrm/ui'
  import IconChat from './icons/Chat.svelte'

  export let label: string
  export let tasks: Array<CheckListItem> = [
    { description: 'Do a UX research', done: true },
    {
      description:
        'I believe the QR “Typography and spacing” is showing the subtle differences in line height that need to be specified when the weight of fonts',
      done: false
    },
    { description: 'We should  stick with the 12 text styles ', done: false }
  ]
</script>

<div class="container">
  <div class="line" />
  <div class="content">
    <div class="header">
      <span>{label}</span>
      <ActionIcon size={24} icon={IconMoreV} direction={'left'} label={'Comments'} />
    </div>
    <div class="checklist"><CheckBoxList items={tasks} /></div>
    <div class="footer">
      <UserInfo />
      <div class="actions">
        <ActionIcon size={24} icon={IconChat} direction={'left'} label={'Comments'} />
        <div class="counter">2</div>
      </div>
    </div>
  </div>
</div>

<style lang="scss">
  .container {
    flex-shrink: 0;
    display: flex;
    align-items: stretch;
    margin: 0 40px 0 72px;
    padding: 20px 0;

    .line {
      margin-right: 14px;
      width: 5px;
      background-color: #22cc62;
      border-radius: 3px;
    }
    .content {
      display: flex;
      flex-direction: column;
      background-color: var(--theme-button-bg-enabled);
      border: 1px solid var(--theme-bg-accent-color);
      border-radius: 12px;

      .header,
      .footer {
        flex-shrink: 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .header {
        padding: 0 16px 0 24px;
        height: 84px;
        span {
          margin-right: 16px;
          font-weight: 500;
          color: var(--theme-content-accent-color);
        }
      }
      .checklist {
        padding: 2px 24px 24px;
      }
      .footer {
        padding: 0 24px;
        height: 74px;
        border-top: 1px solid var(--theme-bg-accent-color);

        .actions {
          display: flex;
          flex-direction: row;
          flex-wrap: nowrap;
          align-items: center;

          .counter {
            margin-left: 4px;
            font-weight: 500;
            color: var(--theme-content-color);
          }
        }
      }
    }
  }
</style>
