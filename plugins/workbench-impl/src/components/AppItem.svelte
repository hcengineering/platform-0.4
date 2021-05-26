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
  import { fly } from 'svelte/transition'

  export let wide: boolean
  export let selected: boolean
  export let notify: boolean
  export let status: boolean
  export let color: string = 'var(--highlight-red)'
</script>

<div class="container" class:wide={wide} on:click>
  {#if notify || status}
    <div style="background-color: {color}" class="marker" class:noty={notify} class:stat={status}/>
  {/if}
  <div class="icon" class:selected={selected} class:noty={notify} class:stat={status}>
    <slot name="icon"/>
  </div>
  {#if wide}
    <div class="caption" in:fly="{{ x: 0, duration: 300 }}" out:fly="{{ x: 0, duration: 300 }}">
      <slot name="caption"/>
    </div>
  {/if}
</div>
{#if notify || status}
  <svg class="mask">
    <clipPath id="notify">
      <path d="M0,0v48h48V0H0z M30,23c-3.9,0-7-3.1-7-7s3.1-7,7-7s7,3.1,7,7S33.9,23,30,23z"/>
    </clipPath>
    <clipPath id="status">
      <path d="M0,0v48h48V0H0z M39,18c-3.9,0-7-3.1-7-7s3.1-7,7-7s7,3.1,7,7S42.9,18,39,18z"/>
    </clipPath>
  </svg>
{/if}

<style lang="scss">
  .mask {
    width: 0;
    height: 0;
  }
  .container {
    position: relative;
    display: flex;
    align-items: center;
    width: 48px;
    height: 48px;
    border-radius: 8px;
    transition: width .3s ease;
    cursor: pointer;

    .marker {
      position: absolute;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      &.noty {
        top: 12px;
        left: 26px;
      }
      &.stat {
        top: 7px;
        left: 35px;
      }
    }

    .icon {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 48px;
      min-width: 48px;
      height: 48px;
      opacity: .3;

      &.selected {
        opacity: 1;
      }
      &.noty {
        clip-path: url(#notify);
      }
      &.stat {
        clip-path: url(#status);
      }
    }

    .caption {
      margin-left: 0;
      width: 0;
      transition: all .3s ease;
      user-select: none;

      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    &:hover {
      background-color: var(--theme-menu-selection);
    }
    &.wide {
      width: 248px;
      .caption {
        width: 184px;
        margin-left: 16px;
      }
    }
  }
</style>