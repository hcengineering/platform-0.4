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
  import type { Asset, UIComponent } from '@anticrm/status'
  import type { IntlString } from '@anticrm/platform'
  import Icon from './Icon.svelte'

  export let label: IntlString | string
  export let href: string = '#'
  export let icon: Asset | UIComponent | undefined
  export let transparent: boolean = false
  export let disabled: boolean = false
  export let maxLenght: number = 26

  const trimFilename = (fname: string): string =>
    maxLenght && fname.length > maxLenght
      ? fname.substr(0, (maxLenght - 1) / 2) + '...' + fname.substr(-(maxLenght - 1) / 2)
      : fname
</script>

<span class="container" class:transparent class:disabled on:click>
  {#if icon}
    <span class="flex-center icon">
      {#if typeof icon === 'string'}
        <Icon {icon} size={16} />
      {:else}
        <svelte:component this={icon} size={16} />
      {/if}
    </span>
  {/if}
  {#if disabled}
    {trimFilename(label)}
  {:else}
    <a {href}>{trimFilename(label)}</a>
  {/if}
</span>

<style lang="scss">
  .container {
    display: inline-flex;
    align-items: center;
    color: var(--theme-content-color);
    cursor: pointer;

    .icon {
      margin-right: 0.25rem;
      transform-origin: center center;
      transform: scale(0.75);
    }
    &:hover {
      color: var(--theme-caption-color);
      a {
        text-decoration: underline;
        color: var(--theme-caption-color);
      }
    }
    &:active {
      color: var(--theme-content-color);
      a {
        text-decoration: underline;
        color: var(--theme-content-color);
      }
    }
  }
  .transparent {
    color: var(--theme-content-trans-color);
    a {
      color: var(--theme-content-trans-color);
    }
    &:hover {
      color: var(--theme-content-color);
      a {
        color: var(--theme-content-color);
      }
    }
    &:active {
      color: var(--theme-content-dark-color);
      a {
        color: var(--theme-content-dark-color);
      }
    }
  }
  .disabled {
    cursor: not-allowed;
    color: var(--theme-content-trans-color);
    &:hover {
      color: var(--theme-content-trans-color);
    }
    &:active {
      color: var(--theme-content-trans-color);
    }
  }
</style>
