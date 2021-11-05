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
  import { EditBox, Label } from '@anticrm/ui'
  import { createEventDispatcher } from 'svelte'

  export let value: string
  export let editable: boolean = false

  const dispatch = createEventDispatcher()

  function save () {
    dispatch('close', value)
  }
</script>

<div class="container">
  <div class="bg" />
  {#if editable}
    <EditBox bind:value on:change={save} />
  {:else}
    <Label label={value} />
  {/if}
</div>

<style lang="scss">
  .container {
    position: relative;
    display: flex;
    flex-direction: column;
    min-width: 320px;
    border-radius: 20px;
    padding: 20px;

    .bg {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      background-color: var(--theme-card-bg);
      border-radius: 20px;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      box-shadow: var(--theme-card-shadow);
      z-index: -1;
    }
  }
</style>
