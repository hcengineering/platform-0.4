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
  import AppItem from './AppItem.svelte'

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

  const applications = [
    { name: 'home', caption: 'Home', component: Home, notify: true },
    { name: 'chat', caption: 'Chat', component: Chat, notify: true },
    { name: 'task', caption: 'Task', component: Task, notify: false },
    { name: 'profile', caption: 'Recruitment', component: Profile, notify: true },
    { name: 'notify', caption: 'Notifications', component: Notify, notify: false },
    { name: 'contact', caption: 'Contacts', component: Contact, notify: false },
    { name: 'calendar', caption: 'Calendar', component: Calendar, notify: false },
    { name: 'apps', caption: 'Apps', component: Apps, notify: false }
  ]
</script>

<div class="app-icons">
  {#each applications as app}
    <div class="app">
      <AppItem wide={wide} selected={active === app.name} notify={app.notify} on:click={() => { active = app.name }}>
        <svelte:component this={app.component} size="32" slot="icon"/>
        <svelte:fragment slot="caption">{app.caption}</svelte:fragment>
      </AppItem>
    </div>
  {/each}
</div>

<style lang="scss">
  .app-icons {
    display: flex;
    flex-direction: column;

    .app {
      height: 48px;
    }

    .app + .app {
      margin-top: 4px;
    }
  }
</style>