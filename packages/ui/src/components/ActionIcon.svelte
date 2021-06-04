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
  import type { IntlString, Asset } from '@anticrm/status'
  import type { AnySvelteComponent } from '../types'

  import Icon from './Icon.svelte'

  export let label: IntlString
  export let icon: Asset | AnySvelteComponent
  export let size: 16 | 20 | 24
  export let action: () => Promise<void>
</script>

<div on:click={action}>
  {#if typeof(icon) === 'string'}
    <Icon {icon} {size}/>
  {:else}
    <svelte:component this={icon} />
  {/if}
</div>