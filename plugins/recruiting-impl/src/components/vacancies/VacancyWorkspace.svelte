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
  import { setContext } from 'svelte'
  import { writable } from 'svelte/store'
  import recruiting from '@anticrm/recruiting'
  import calendar from '@anticrm/calendar'
  import type { VacancySpace } from '@anticrm/recruiting'
  import { Component, Tabs } from '@anticrm/ui'

  export let space: VacancySpace
  const spaceS = writable(space)

  $: spaceS.set(space)

  setContext('space', spaceS)

  let selectedTab = recruiting.string.Applications
  const tabs = new Map([
    [recruiting.string.Applications, recruiting.component.Applications],
    [recruiting.string.Interviews, calendar.component.EventTable]
  ])
  const tabOpts = [...tabs.keys()]

  let content = recruiting.component.Applications
  $: content = tabs.get(selectedTab) ?? recruiting.component.Applications
</script>

<div class="root">
  <div class="tabs">
    <Tabs tabs={tabOpts} bind:selected={selectedTab} />
  </div>
  <Component is={content} props={{space, currentSpace: space._id}} />
</div>

<style lang="scss">
  .root {
    display: flex;
    flex-direction: column;
    align-items: stretch;

    width: 100%;
    height: 100%;
  }

  .tabs {
    padding: 0 30px;
  }
</style>
