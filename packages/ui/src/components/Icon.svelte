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
  import type { Asset } from '@anticrm/status'
  import { getMetadata } from '@anticrm/platform'

  export let icon: Asset
  export let size: string
  export let fill: string

  let url: string
  $: url = getMetadata(icon) ?? 'https://anticrm.org/logo.svg'
</script>

<svg width={size} height={size} {fill}>
  <use href={url} />
</svg>

