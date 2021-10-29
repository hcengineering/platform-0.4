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
  import type { DocumentQuery } from '@anticrm/core'
  import type { QueryUpdater } from '@anticrm/presentation'
  import type { Task } from '@anticrm/task'
  import task from '@anticrm/task'
  import { ScrollBox } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import Card from './Card.svelte'
  import LimitHeader from './LimitHeader.svelte'

  export let query: DocumentQuery<Task>
  const client = getClient()
  let cards: Task[] = []
  let lq: QueryUpdater<Task> | undefined

  let skip = 0
  let total = 0
  const limit = 150

  $: if (query !== undefined) {
    lq = client.query(
      lq,
      task.class.Task,
      query,
      (result) => {
        cards = result
        total = result.total
      },
      { skip, limit }
    )
  }
</script>

<LimitHeader bind:skip {total} {limit} />

<ScrollBox vertical>
  <div class="cards-container">
    {#each cards as card}
      <Card {card} />
    {/each}
  </div>
</ScrollBox>

<style lang="scss">
  .cards-container {
    display: grid;
    overflow: auto;
    height: max-content;
    grid-template-columns: repeat(auto-fit, minmax(220px, auto));
    grid-auto-rows: 280px;
    grid-gap: 20px;
  }
</style>
