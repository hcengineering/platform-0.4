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
  import TreeElement from './TreeElement.svelte'
  import type { Asset } from '@anticrm/status'
  import { createEventDispatcher } from 'svelte'
  import type { AnyComponent } from '@anticrm/status'
  import { Action } from '@anticrm/ui'

  export let component: AnyComponent | undefined = undefined
  export let props: any | undefined
  export let icon: Asset | undefined
  export let title: string
  export let notifications = 0
  export let changed: boolean
  export let actions: Action[] = []

  const dispatch = createEventDispatcher()
</script>

<TreeElement
  {component}
  {props}
  {icon}
  {title}
  {actions}
  {notifications}
  {changed}
  collapsed
  on:click={() => {
    dispatch('click')
  }}
/>
