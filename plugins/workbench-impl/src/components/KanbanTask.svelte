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
  import { IntlString } from '@anticrm/status'
  import { Label, ActionIcon } from '@anticrm/ui'
  import type { AnySvelteComponent } from '@anticrm/ui'
  import MoreH from './icons/MoreH.svelte'

  export let icon: AnySvelteComponent
  export let title: IntlString
  export let text: IntlString

  let toolInvisible: boolean = true
</script>

<div class="task-container">
  <div class="header" on:mouseover={() => { toolInvisible = false }} on:mouseout={() => { toolInvisible = true }}>
    <div class="icon"><svelte:component this={icon} size={24}/></div>
    <div class="title"><Label label={title}/></div>
    <div class="button"><ActionIcon icon={MoreH} size={20} label={'More...'} direction={'left'} invisible={toolInvisible}/></div>
  </div>
  <div class="text">{text}</div>
</div>

<style lang="scss">
  .task-container {
    display: flex;
    flex-direction: column;
    margin: 14px 16px 20px;
    color: var(--theme-caption-color);

    .header {
      display: flex;
      align-items: center;
      height: 24px;
      margin-bottom: 12px;

      .icon {
        width: 24px;
        height: 24px;
      }
      .title {
        margin-left: 8px;
        flex-grow: 1;
        font-weight: 500;
        font-size: 16px;
        line-height: 150%;
      }
      .button {
        margin-left: 16px;
      }
    }
    .text {
      font-weight: 500;
      font-size: 14px;
      opacity: .4;
    }
  }
</style>
