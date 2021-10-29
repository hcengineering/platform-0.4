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
  import { Card, EditBox, ToggleWithLabel, Grid } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'

  import task from '../plugin'
  import core from '@anticrm/core'

  const client = getClient()

  let name: string = ''
  let isPrivate: boolean = false

  function createProject () {
    client.createDoc(task.class.Project, core.space.Model, {
      name,
      description: '',
      private: isPrivate,
      members: [client.accountId()]
    })
  }
</script>

<Card label={task.string.CreateProject} okAction={createProject} on:close canSave={!!name}>
  <Grid column={1} rowGap={20}>
    <EditBox label={task.string.ProjectName} bind:value={name} focus />
    <ToggleWithLabel
      label={task.string.MakePrivate}
      description={task.string.MakePrivateDescription}
      bind:on={isPrivate}
    />
  </Grid>
</Card>
