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
  import Card from './Card.svelte'

  export let cards: Array<Object> =
             [{ id: 'c01', user: 'chen', progress: { min: 0, max: 5, value: 4 }, discussion: 4, attach: 2,
                title: 'Create UI for apps without the spaces',
                description: `That's the only place in the lands we've ever heard of that we don't want to see.` },
              { id: 'c02', user: 'tim', progress: { color: '#22CC62', value: 100 }, discussion: 10,
                title: 'Change font size from 16px to 14px',
                description: `That's the only place in the lands we've ever heard of that we don't want to see.` },
              { id: 'c03', user: 'kathryn', progress: { color: '#F96E50', min: 0, max: 5, value: 1 }, discussion: 4, attach: 18,
                title: 'Create UI for apps without the spaces',
                description: `That's the only place in the lands we've ever heard of that we don't want to see.` },
              { id: 'c04', user: 'elon', progress: { color: '#AA83FC', value: 5 }, attach: 1,
                title: 'Change font size from 16px to 14px',
                description: `That's the only place in the lands we've ever heard of that we don't want to see.` },
              { id: 'c05', user: 'chen', discussion: 4, attach: 2,
                title: 'Create UI for apps without the spaces',
                description: `That's the only place in the lands we've ever heard of that we don't want to see.` },
              { id: 'c06', user: 'tim', progress: { color: '#22CC62', value: 100 },
                title: 'Change font size from 16px to 14px',
                description: `That's the only place in the lands we've ever heard of that we don't want to see.` },
              { id: 'c07', user: 'kathryn', progress: { color: '#F96E50', min: 0, max: 5, value: 1 }, discussion: 4, attach: 18,
                title: 'Create UI for apps without the spaces',
                description: `That's the only place in the lands we've ever heard of that we don't want to see.` },
              { id: 'c08', user: 'elon', progress: { color: '#AA83FC', value: 5 }, attach: 1,
                title: 'Change font size from 16px to 14px',
                description: `That's the only place in the lands we've ever heard of that we don't want to see.` }]
</script>

<div class="cards-container">
  {#each cards as card}
    <Card {...card}/>
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