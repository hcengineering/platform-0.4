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
  import type { UIComponent } from '@anticrm/status'
  import { createEventDispatcher, onDestroy, onMount } from 'svelte'

  export let component: UIComponent
  export let doc: any

  const dispatch = createEventDispatcher()
  let root: HTMLElement

  const rObs = new ResizeObserver((entries) => {
    const rect = entries[0]?.contentRect

    if (rect === undefined) {
      return
    }

    dispatch('sizeChange', [rect.width, rect.height])
  })

  onMount(() => {
    rObs.observe(root)

    const rect = root.getBoundingClientRect()
    dispatch('sizeChange', [rect.width, rect.height])
  })

  onDestroy(() => {
    rObs.disconnect()
  })
</script>

<div bind:this={root} class="root">
  <svelte:component this={component} {doc} />
</div>

<style lang="scss">
  .root {
    cursor: grab;
    background-color: var(--theme-kanban-card-bg);
    border-radius: 12px;
    overflow: hidden;
  }
</style>
