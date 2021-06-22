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
  import { ActionIcon } from '@anticrm/ui'
  import UserInfo from './UserInfo.svelte'
  import MoreH from './icons/MoreH.svelte'

  export let user: string
</script>

<section class="card-container">
  <div class="header">
    <UserInfo {user} suptitle={'Candidate'} size={32}/>
    <ActionIcon icon={MoreH} direction={'left'} label={'More...'}/>
  </div>
  <slot/>
</section>

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
  }
</style>