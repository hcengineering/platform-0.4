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
  import chen from '../../img/chen.png'
  import tim from '../../img/tim.png'
  import elon from '../../img/elon.png'
  import kathryn from '../../img/kathryn.png'

  export let users: Object[] = [{ avatar: chen, name: 'chen', title: 'Rosamund Chen' },
                                { avatar: tim, name: 'tim', title: 'Tim Ferris' },
                                { avatar: elon, name: 'elon', title: 'Elon Musk' },
                                { avatar: kathryn, name: 'kathryn', title: 'Kathryn Minshew' }]
  export let user: string = 'chen'
  export let suptitle: string | undefined
  export let size: 24 | 32 = 24
  export let avatarOnly: boolean = false
</script>

<div class="user-container">
  <div style="width: {size}px; height: {size}px;"><img style="width: {size}px; height: {size}px;" src={users.find(u => u.name === user).avatar} alt={20}/></div>
  {#if !avatarOnly}
    <div class="caption">
      {#if suptitle}<div class="suptitle">{suptitle}</div>{/if}
      <div class="title">{users.find(u => u.name === user).title}</div>
    </div>
  {/if}
</div>

<style lang="scss">
  .user-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    flex-wrap: nowrap;

    .caption {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      margin-left: 8px;
      color: var(--theme-caption-color);

      .suptitle {
        opacity: .4;
      }
      .title {
        max-width: 150px;
        font-weight: 500;
        text-align: left;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
    }
  }
</style>