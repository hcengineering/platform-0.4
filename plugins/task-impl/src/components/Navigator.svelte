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
  import { onDestroy } from 'svelte'
  import type { Project } from '@anticrm/task'
  import { getClient } from '@anticrm/workbench'
  import { TreeNode, TreeItem } from '@anticrm/ui'

  import task from '../plugin'

  let projects: Project[] = []
  onDestroy(getClient().query(task.class.Project, {}, result => { projects = result }))

</script>

<div>
  <TreeNode title="Projects">
    {#each projects as project}
      <TreeItem title={project.name} icon={task.icon.Task}/>
    {/each}
  </TreeNode>
</div>
