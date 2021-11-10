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
  import type { IntlString, Asset, UIComponent } from '@anticrm/status'
  import type { TooltipAligment } from '..'

  import Icon from './Icon.svelte'
  import Tooltip from './Tooltip.svelte'

  export let label: IntlString
  export let direction: TooltipAligment = 'right'
  export let icon: Asset | UIComponent
  export let fill: string = 'var(--theme-caption-color)'
  export let filled: boolean = false
  export let size: 12 | 16 | 20 | 24
  export let action: (ev?: Event) => void = () => {}
  export let invisible: boolean = false
  export let circleSize: 0 | 16 | 18 | 24 | 28 | 36 = 0

  export function buttonStyle (size: number, padding: number, margin: number): string {
    let style = ''
    if (circleSize > 0) {
      style += `width: ${size}px; height: ${size}px;`
    }
    return style
  }
</script>

<Tooltip {label} {direction}>
  <button
    class="button"
    style={buttonStyle(circleSize)}
    on:click|stopPropagation={action}
    class:circle-button={circleSize > 0}
  >
    <div class="icon" style="width: {size}px; height: {size}px;" class:invisible>
      <Icon {icon} {size} {fill} {filled} />
    </div>
  </button>
</Tooltip>

<style lang="scss">
  .circle-button {
    border: 1px solid var(--theme-dialog-divider) !important;
    border-radius: 50px !important;
  }
  .button {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0;
    border: 1px solid transparent;
    border-radius: 4px;
    outline: none;
    background-color: transparent;
    cursor: pointer;

    .icon {
      opacity: 0.3;
      &.invisible {
        opacity: 0;
      }
    }
    &:hover .icon {
      opacity: 1;
    }
    &:focus {
      border: 1px solid var(--primary-button-focused-border);
      box-shadow: 0 0 0 3px var(--primary-button-outline);
      .icon {
        opacity: 1;
      }
    }
  }
</style>
