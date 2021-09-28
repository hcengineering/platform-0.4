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
  import { createEventDispatcher } from 'svelte'
  import type { IntlString } from '@anticrm/platform'
  import { showPopup } from '..'
  import DatePickerPopup from './popups/DatePickerPopup.svelte'
  import Label from './Label.svelte'
  import Calendar from './icons/Calendar.svelte'

  export let label: IntlString
  export let value: Date = new Date(Date.now())

  const dispatch = createEventDispatcher()

  let btn: HTMLElement
</script>

<div
  class="datepicker-container"
  on:click={() => {
    showPopup(DatePickerPopup, { label, value }, btn, (result) => {
      if (result) {
        value = result
        dispatch('change', result)
      }
    })
  }}
>
  <button class="btn" bind:this={btn}><Calendar size={16} /></button>
  <div class="selectDate">
    <div class="content-accent-color"><Label {label} /></div>
    <div class="date">
      {value.getMonth() + 1} / {value.getDate()} / {value.getFullYear()}
    </div>
  </div>
</div>

<style lang="scss">
  .datepicker-container {
    display: flex;
    flex-wrap: nowrap;
    cursor: pointer;

    .btn {
      width: 36px;
      min-width: 36px;
      height: 36px;
      border: 1px solid var(--theme-bg-focused-color);
      border-radius: 50%;
      &:hover {
        background-color: var(--theme-bg-accent-hover);
      }
      &:active {
        background-color: var(--theme-bg-accent-color);
      }
    }

    .selectDate {
      margin-left: 12px;
    }
  }
</style>
