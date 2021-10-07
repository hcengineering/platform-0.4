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
  import { IntlString } from '@anticrm/platform'
  import Label from '../Label.svelte'
  import Back from '../icons/Back.svelte'
  import Close from '../icons/Close.svelte'
  import Forward from '../icons/Forward.svelte'
  import { createEventDispatcher } from 'svelte'

  export let label: IntlString
  export let value: Date | undefined = undefined

  let view: Date
  $: view = value ?? new Date(Date.now())
  const months: Array<string> = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ]
  let monthYear: string
  let days: Array<number>

  const dispatch = createEventDispatcher()

  const daysInMonth = (date: Date): number => {
    return 33 - new Date(date.getFullYear(), date.getMonth(), 33).getDate()
  }

  $: {
    monthYear = months[view.getMonth()] + ' ' + view.getFullYear()
    days = []
    for (let i = 1; i <= daysInMonth(view); i++) {
      days.push(new Date(view.getFullYear(), view.getMonth(), i).getDay())
    }
  }
</script>

<div class="datepicker-popup">
  <div class="flex-between">
    <div>
      {#if label}<div class="title"><Label {label} /></div>{/if}
    </div>
    <div>
      <button
        class="arrow"
        on:click|preventDefault={() => {
          value = undefined
          dispatch('close', value)
        }}><Close size={16} /></button
      >
    </div>
  </div>
  <div class="flex-between">
    <button
      class="arrow"
      on:click|preventDefault={() => {
        view.setMonth(view.getMonth() - 1)
        view = view
      }}><Back size={16} /></button
    >
    <div class="caption-color">
      {monthYear}
    </div>
    <button
      class="arrow"
      on:click|preventDefault={() => {
        view.setMonth(view.getMonth() + 1)
        view = view
      }}><Forward size={16} /></button
    >
  </div>
  <div class="calendar">
    <div class="flex-center caption">Mo</div>
    <div class="flex-center caption">Tu</div>
    <div class="flex-center caption">We</div>
    <div class="flex-center caption">Th</div>
    <div class="flex-center caption">Fr</div>
    <div class="flex-center caption">Sa</div>
    <div class="flex-center caption">Su</div>
    {#each days as day, i}
      <div
        class="flex-center day"
        class:selected={i + 1 === value?.getDate() &&
          view.getMonth() === value?.getMonth() &&
          view.getFullYear() === value?.getFullYear()}
        style="grid-column: {day + 1}/{day + 2};"
        on:click={() => {
          value = new Date(view.getFullYear(), view.getMonth(), i + 1)
          dispatch('close', value)
        }}
      >
        {i + 1}
      </div>
    {/each}
  </div>
</div>

<style lang="scss">
  .datepicker-popup {
    display: flex;
    flex-direction: column;
    padding: 16px;
    height: min-content;
    background-color: var(--theme-popup-bg);
    border: var(--theme-popup-border);
    border-radius: 20px;
    box-shadow: var(--theme-popup-shadow);
    -webkit-backdrop-filter: blur(30px);
    backdrop-filter: blur(30px);

    .title {
      margin-bottom: 16px;
      font-weight: 500;
      color: var(--theme-content-accent-color);
    }
    .arrow {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      &:hover {
        background-color: var(--theme-bg-accent-hover);
      }
      &:active {
        background-color: var(--theme-bg-accent-color);
      }
    }

    .calendar {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      margin-top: 20px;

      .caption {
        height: 36px;
        font-size: 12px;
        color: var(--theme-content-trans-color);
      }
      .day {
        width: 36px;
        height: 36px;
        font-weight: 500;
        border-radius: 8px;
        cursor: pointer;
        &.selected {
          background-color: var(--theme-button-bg-focused);
          color: var(--theme-caption-color);
        }
        &:hover {
          background-color: var(--theme-bg-accent-hover);
        }
      }
    }
  }
</style>
