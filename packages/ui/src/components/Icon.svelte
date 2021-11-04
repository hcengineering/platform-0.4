<!--
// Copyright © 2020, 2021 Anticrm Platform Contributors.
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
  import { getMetadata } from '@anticrm/platform'

  export let icon: Asset | UIComponent
  export let size: 12 | 16 | 20 | 24 | 28
  export let fill = 'currentColor'

  function isAsset (icon: Asset | UIComponent): boolean {
    return typeof icon === 'string'
  }

  function toAsset (icon: UIComponent | Asset): Asset {
    return icon as Asset
  }

  let url: string
  $: url = isAsset(icon) ? getMetadata(toAsset(icon)) ?? 'https://anticrm.org/logo.svg' : ''
</script>

{#if isAsset(icon)}
  <svg width={size} height={size} {fill}>
    <use href={url} />
  </svg>
{:else}
  <svelte:component this={icon} {size} filled={fill} />
{/if}
