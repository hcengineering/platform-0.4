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
  import TaskView from './TaskView.svelte'
  import { getClient } from '@anticrm/workbench'
  import task from '@anticrm/task'
  import type { Project } from '@anticrm/task'
  import type { QueryUpdater } from '@anticrm/presentation'
  import type { Ref } from '@anticrm/core'

  const client = getClient()

  let query: QueryUpdater<Project> | undefined
  let ids: Array<Ref<Project>> = []

  query = client.query(query, task.class.Project, { 'account.starred': true }, (result) => {
    ids = result.map(p => p._id)
  })
</script>

<TaskView query={{ space: { $in: ids }}} />
