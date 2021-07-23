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
  import { Class, Ref, Space } from '@anticrm/core'
  import { Task } from '@anticrm/task'
  import { getClient } from '@anticrm/workbench'
  import { QueryUpdater } from '@anticrm/presentation'

  import Card from './Card.svelte'

  export let _class: Ref<Class<Task>>
  export let currentSpace: Ref<Space> | undefined
  const client = getClient()
  let cards: Task[] = []
  let query: QueryUpdater<Task> | undefined

  $: if (currentSpace !== undefined) {
    query = client.query(query, _class, { space: currentSpace }, (result) => {
      cards = result
    })
  }
</script>

<div class="cards-container">
  {#each cards as card}
    <Card {card} />
  {/each}
</div>

<style lang="scss">
  .cards-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, auto));
    grid-auto-rows: 280px;
    grid-gap: 20px;
  }
</style>
