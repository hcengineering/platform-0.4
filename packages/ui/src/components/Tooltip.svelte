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
  import type { IntlString, UIComponent } from '@anticrm/status'
  import type { TooltipAligment } from '..'
  import { tooltipstore as tooltip, showTooltip } from '..'

  export let label: IntlString | undefined = undefined
  export let direction: TooltipAligment
  export let component: UIComponent | undefined = undefined
  export let props: any | undefined = undefined
  export let onClose: (result?: any) => void = () => {}

  let triggerHTML: HTMLElement
  let shown: boolean = false
  $: shown = !!($tooltip.label || $tooltip.component)
</script>

<div
  class="tooltip-trigger"
  bind:this={triggerHTML}
  on:mousemove={() => {
    if (!shown) showTooltip(label, triggerHTML, direction, component, props, onClose)
  }}
>
  <slot />
</div>
