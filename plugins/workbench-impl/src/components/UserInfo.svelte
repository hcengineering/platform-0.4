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
</script>

<div class="user-container">
  <div class="avatar"><img src={users.find(u => u.name === user).avatar} alt={20}/></div>
  <div class="title">{users.find(u => u.name === user).title}</div>
</div>

<style lang="scss">
  .user-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    flex-wrap: nowrap;

    .avatar {
      width: 24px;
      height: 24px;
    }
    .title {
      flex-grow: 1;
      margin-left: 12px;
      color: var(--theme-content-color);
    }
  }
</style>