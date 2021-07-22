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
  import Label from './Label.svelte'
  import PopupMenu from './PopupMenu.svelte'
  import Calendar from './icons/Calendar.svelte'
  import Close from './icons/Close.svelte'
  import Back from './icons/Back.svelte'
  import Forward from './icons/Forward.svelte'

  export let title: IntlString
  export let selected: Date = new Date(Date.now())
  export let vAlign: 'top' | 'middle' | 'bottom' = 'bottom'
  export let hAlign: 'left' | 'center' | 'right' = 'left'
  export let margin: number = 16

  let pressed: boolean = false
  let view: Date = selected
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

<div class="userBox">
  <PopupMenu {vAlign} {hAlign} {margin} bind:show={pressed} bind:title showHeader>
    <button
      slot="trigger"
      class="btn"
      class:selected={pressed}
      on:click={(event) => {
        pressed = !pressed
        event.stopPropagation()
      }}
    >
      <div class="icon">
        {#if pressed}<Close />{:else}<Calendar size={20} />{/if}
      </div>
    </button>
    <div slot="header" class="header">
      <button
        class="btn arrow"
        on:click|preventDefault={() => {
          view.setMonth(view.getMonth() - 1)
          view = view
        }}><Back size={12} /></button
      >
      <div class="monthYear">
        {monthYear}
      </div>
      <button
        class="btn arrow"
        on:click|preventDefault={() => {
          view.setMonth(view.getMonth() + 1)
          view = view
        }}><Forward size={12} /></button
      >
    </div>
    <div class="calendar">
      <div class="caption">Mo</div>
      <div class="caption">Tu</div>
      <div class="caption">We</div>
      <div class="caption">Th</div>
      <div class="caption">Fr</div>
      <div class="caption">Sa</div>
      <div class="caption">Su</div>
      {#each days as day, i}
        <div
          class="day"
          class:selected={i + 1 === selected.getDate() &&
            view.getMonth() === selected.getMonth() &&
            view.getFullYear() === selected.getFullYear()}
          style="grid-column: {day + 1}/{day + 2};"
          on:click={() => {
            selected = new Date(view.getFullYear(), view.getMonth(), i + 1)
            pressed = false
          }}
        >
          {i + 1}
        </div>
      {/each}
    </div>
  </PopupMenu>
  <div class="selectDate">
    <div class="title"><Label label={title} /></div>
    <div class="date">
      {selected.getMonth() + 1} / {selected.getDate()} / {selected.getFullYear()}
    </div>
  </div>
</div>

<style lang="scss">
  .userBox {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    width: auto;

    .btn {
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 0;
      padding: 0;
      width: 36px;
      height: 36px;
      background-color: var(--theme-button-bg-focused);
      border: 1px solid transparent;
      border-radius: 8px;
      outline: none;
      cursor: pointer;

      .icon {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 20px;
        height: 20px;
        opacity: 0.3;
      }

      &.arrow {
        width: 28px;
        height: 28px;
        border: 1px solid var(--theme-bg-accent-color);
        border-radius: 4px;
      }

      &.selected {
        background-color: var(--theme-button-bg-focused);
        border: 1px solid var(--theme-bg-accent-color);
        .icon {
          opacity: 0.6;
        }
      }

      &:hover {
        background-color: var(--theme-button-bg-pressed);
        border: 1px solid var(--theme-bg-accent-color);
        .icon {
          opacity: 1;
        }
      }
      &:focus {
        border: 1px solid var(--primary-button-focused-border);
        box-shadow: 0 0 0 3px var(--primary-button-outline);
        .icon {
          opacity: 1;
        }
      }
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      min-width: 200px;

      .monthYear {
        margin: 0 16px;
        font-weight: 600;
        color: var(--theme-content-color);
        white-space: nowrap;
      }
    }

    .calendar {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      margin-top: 20px;

      .caption {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 36px;
        font-size: 12px;
        color: var(--theme-content-trans-color);
      }
      .day {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 36px;
        height: 36px;
        font-size: 14px;
        font-weight: 500;
        line-height: 24px;
        letter-spacing: -0.5;
        color: var(--theme-content-color);
        border-radius: 8px;
        cursor: pointer;

        &.selected {
          background-color: rgb(68 116 246 / 10%);
          border: 1px solid var(--theme-bg-accent-color);
          color: var(--primary-button-enabled);
        }
        &:hover {
          background-color: var(--theme-bg-accent-color);
        }
      }
    }

    .selectDate {
      margin-left: 12px;
      font-size: 14px;
      .title {
        color: var(--theme-content-color);
      }
      .date {
        color: var(--theme-caption-color);
      }
    }
  }
</style>
