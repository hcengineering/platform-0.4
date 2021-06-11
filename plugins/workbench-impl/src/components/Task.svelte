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
  import AppHeader from './AppHeader.svelte'
  import ViewSelection from './ViewSelection.svelte'
  import Table from './Table.svelte'

  export let title: IntlString
  export let subtitle: IntlString | undefined
  export let thread: boolean = false
</script>

<div class="task-container">
  <AppHeader {title} {subtitle} {thread}/>
  <div class="toolbar">
    <div style="flex-grow: 1"></div>
    <ViewSelection/>
  </div>
  <div class="table">
    <Table/>
  </div>
</div>

<style lang="scss">
  .task-container {
    display: flex;
    flex-direction: column;
    height: 100%;

    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      height: 80px;
      padding: 0 40px;
    }

    .table {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      margin: 0px 15px 15px;
      padding: 0px 5px 5px;
      overflow: auto;
    }
  }
</style>
