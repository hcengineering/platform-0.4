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
  import type { IntlString } from '@anticrm/platform'
  import type { UIComponent } from '@anticrm/status'
  import Label from './Label.svelte'
  import Check from './icons/Check.svelte'

  export let title: IntlString | string | undefined = undefined
  export let component: UIComponent | undefined = undefined
  export let props: Object = {}
  export let selectable: boolean = false
  export let selected: boolean = false
  export let action: () => void = () => {}

  if (title) {
    component = Label
    props = { label: title }
  }
</script>

<div
  class="popup-item"
  on:click={() => {
    if (selectable) selected = !selected
    action?.()
  }}
>
  <div class="title">
    <svelte:component this={component} {...props} />
  </div>
  {#if selectable}
    <div class="check" class:selected><Check /></div>
  {/if}
</div>

<style lang="scss">
  .popup-item {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 8px;
    border-radius: 8px;
    cursor: pointer;

    .title {
      flex-grow: 1;
      font-size: 14px;
      line-height: 18px;
      text-align: left;
      color: var(--theme-content-accent-color);
    }

    .check {
      margin-left: 12px;
      border-radius: 50%;
      opacity: 0;
      &.selected {
        opacity: 0.8;
      }
    }

    &:hover {
      background-color: var(--theme-button-bg-focused);
      .title {
        color: var(--theme-caption-color);
      }
      .check {
        opacity: 0.2;
        &.selected {
          opacity: 1;
        }
      }
    }
  }
</style>
