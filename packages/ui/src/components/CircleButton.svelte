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
  import type { UIComponent, Asset } from '@anticrm/status'
  import Icon from './Icon.svelte'

  export let icon: Asset | UIComponent
  export let size: 'small' | 'medium' | 'large' = 'small'
  export let transparent: boolean = false
  export let selected: boolean = false
</script>

<div class="flex-center icon-button icon-{size}" class:selected class:transparent on:click>
  <Icon {icon} size={size === 'small' ? 10 : 12} />
</div>

<style lang="scss">
  .icon-button {
    border: 1px solid var(--theme-card-divider);
    border-radius: 50%;
    backdrop-filter: blur(3px);
    cursor: pointer;

    &.selected {
      background-color: var(--theme-button-bg-hovered);
    }
    &.transparent {
      background-color: rgba(31, 31, 37, 0.3);
    }
    &:hover {
      border-color: var(--theme-bg-focused-border);
    }
    &:active {
      background-color: var(--theme-bg-accent-color);
    }
  }
  .icon-small {
    width: 1.5rem;
    height: 1.5rem;
  }
  .icon-medium {
    width: 1.75rem;
    height: 1.75rem;
  }
  .icon-large {
    width: 2rem;
    height: 2rem;
  }
</style>
