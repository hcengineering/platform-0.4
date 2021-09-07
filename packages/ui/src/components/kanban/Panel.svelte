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
  import type { IntlString } from '@anticrm/status'

  import Label from '../Label.svelte'
  import ScrollBox from '../ScrollBox.svelte'
  import Grid from '../Grid.svelte'

  export let title: IntlString
  export let counter: number | undefined
  export let color: string = '#F28469'

  let collapsed: boolean = false
</script>

<section class="panel-kanban" on:dragover on:drop class:collapsed>
  <div
    class="header"
    class:collapsed
    style="background-color: {color}"
    on:click={() => {
      collapsed = !collapsed
    }}
  >
    {#if collapsed !== true}<div class="title"><Label label={title} /></div>{/if}
    <div class="counter">{counter}</div>
  </div>
  {#if collapsed !== true}
    <div class="scroll">
      <ScrollBox vertical>
        <Grid column={1} rowGap={12}>
          <slot />
        </Grid>
      </ScrollBox>
    </div>
  {/if}
</section>

<style lang="scss">
  .panel-kanban {
    display: flex;
    flex-direction: column;
    align-items: stretch;

    min-width: 320px;
    height: 100%;
    background-color: var(--theme-bg-accent-color);
    border: 1px solid var(--theme-bg-accent-color);
    border-radius: 12px;

    &.collapsed {
      width: 80px;
    }
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    margin: 12px;
    padding: 0 8px;
    min-height: 44px;

    color: #fff;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 8px;

    cursor: pointer;

    &.collapsed {
      justify-content: center;
    }
  }
  .title {
    padding-left: 8px;
    font-weight: 500;
  }
  .counter {
    display: flex;
    justify-content: center;
    align-items: center;

    width: 28px;
    height: 28px;

    font-weight: 600;

    background-color: rgba(47, 47, 52, 0.09);
    border-radius: 50%;
  }

  .scroll {
    margin: 12px;
    height: 100%;
  }
</style>