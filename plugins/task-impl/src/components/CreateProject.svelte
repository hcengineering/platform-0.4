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
  import { EditBox, Dialog, TextArea, ToggleWithLabel, Section, IconFile, IconComments, Grid, Row } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'

  import task from '../plugin'
  import core from '@anticrm/core'

  let name: string = ''
  let description: string = ''
  let isPrivate: boolean = false

  const client = getClient()

  function createProject () {
    client.createDoc(task.class.Project, core.space.Model, {
      name,
      description,
      private: isPrivate,
      members: [client.accountId()]
    })
  }
</script>

<Dialog label={task.string.CreateProject} okLabel={task.string.CreateProject} okAction={createProject} on:close>
    <Section icon={IconFile} label={'General Information'}>
      <Grid column={1}>
        <EditBox label={task.string.ProjectName} bind:value={name} />
        <TextArea label={task.string.ProjectDescription} bind:value={description} />
        <ToggleWithLabel
          label={task.string.MakePrivate}
          description={task.string.MakePrivateDescription}
          bind:on={isPrivate}
        />
      </Grid>
    </Section>
    <Section icon={IconComments} label={'Project Members'} closed>
    </Section>
</Dialog>
