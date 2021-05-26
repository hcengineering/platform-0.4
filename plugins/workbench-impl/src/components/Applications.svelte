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
  import { slide } from 'svelte/transition'
  import AppItem from './AppItem.svelte'
  import Expanded from './icons/Expanded.svelte'
  import StarPin from './icons/StarPin.svelte'

  import Apps from './icons/Apps.svelte'
  import Chat from './icons/Chat.svelte'
  import Home from './icons/Home.svelte'
  import Task from './icons/Task.svelte'
  import Profile from './icons/Profile.svelte'
  import Notify from './icons/Notify.svelte'
  import Contact from './icons/Contact.svelte'
  import Calendar from './icons/Calendar.svelte'

  export let active: string = 'home'
  export let wide: boolean

  let state: string = 'collapsed'
  let applications = [
    { name: 'home', caption: 'Home', component: Home, pinned: true, notify: true },
    { name: 'chat', caption: 'Chat', component: Chat, pinned: true, notify: true },
    { name: 'task', caption: 'Task', component: Task, pinned: true, notify: false },
    { name: 'profile', caption: 'Recruitment', component: Profile, pinned: true, notify: true },
    { name: 'notify', caption: 'Notifications', component: Notify, pinned: false, notify: false },
    { name: 'contact', caption: 'Contacts', component: Contact, pinned: false, notify: false },
    { name: 'calendar', caption: 'Calendar', component: Calendar, pinned: false, notify: false }
  ]
</script>

<div class="app-icons">
  {#each applications.filter(app => app.pinned) as app}
    <div class="app" transition:slide="{{ duration: 500 }}">
      <AppItem {wide}
              selected={active === app.name} notify={app.notify}
              on:click={() => { active = app.name }}>
        <svelte:component this={app.component} size="32" slot="icon"/>
        <svelte:fragment slot="caption">{app.caption}</svelte:fragment>
      </AppItem>
    </div>
  {/each}

  <div class="app app-group" transition:slide="{{ duration: 500 }}"
       on:click={() => { state === 'collapsed' ? state = 'expanded' : state = 'collapsed' }}>
    <AppItem {wide}>
      <svelte:component this={Apps} size="32" slot="icon"/>
      <svelte:fragment slot="caption">
        <div class="title-group">
          Apps
          <div class="arrow" class:expanded={state === 'expanded'}>
            <svelte:component this={Expanded}/>
          </div>
        </div>
      </svelte:fragment>
    </AppItem>
  </div>

  {#if state === "expanded" && wide}
    {#each applications as app}
      <div class="list" transition:slide="{{ duration: 500 }}">
        <AppItem {wide} list
                 on:click={() => { app.pinned = !app.pinned }}>
          <svelte:fragment slot="caption">
            <div class="title-group">
              {app.caption}
              <div class="star-container">
                <div class="star"><svelte:component this={StarPin} selected={app.pinned}/></div>
                <div class="border"><svelte:component this={StarPin}/></div>
              </div>
            </div>
          </svelte:fragment>
        </AppItem>
      </div>
    {/each}
  {/if}
</div>

<style lang="scss">
  .app-icons {
    display: flex;
    flex-direction: column;
    transition: all .5s ease;

    .app {
      height: 48px;

      &-group {
        margin-top: 4px;
        margin-bottom: 6px;
        .title-group {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-right: 12px;
          .arrow {
            width: 16px;
            height: 16px;
            opacity: .4;
            transition: transform .3s ease;
            transform: rotate(180deg);
            &.expanded {
              transform: rotate(0deg);
            }
          }
        }
      }
    }
    .app + .app {
      margin-top: 4px;
    }

    .list {
      height: 48px;

      .title-group {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-right: 12px;
        .star-container {
          position: relative;
          width: 16px;
          height: 16px;
          .star {
            position: absolute;
            opacity: .3;
          }
          .border {
            opacity: 0;
          }
        }
      }
      &:hover .title-group .star-container .border {
        opacity: .5;
      }
    }
    .list + .list {
      margin-top: 0;
    }
  }
</style>