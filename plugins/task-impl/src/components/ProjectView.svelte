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
  import type { Ref, Space } from '@anticrm/core'
  import TaskView from './TaskView.svelte'
  import task from '../plugin'
  import { Label } from '@anticrm/ui'
  import { SpaceLastViews } from '@anticrm/notification'

  export let currentSpace: Ref<Space>
  export let spaceLastViews: SpaceLastViews
  $: spacesLastViews = new Map<Ref<Space>, SpaceLastViews>().set(currentSpace, spaceLastViews)
</script>

{#if currentSpace}
  <TaskView query={{ space: currentSpace }} {spacesLastViews} />
{:else}
  <Label label={task.string.PleaseSelectSpace} />
{/if}
