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
  import { EditBox, Card, Grid, ToggleWithLabel } from '@anticrm/ui'

  import { getClient } from '@anticrm/workbench'

  import chunter from '../plugin'
  import core from '@anticrm/core'

  let name: string = ''
  const description: string = ''
  let isPrivate: boolean = false

  const client = getClient()

  function createChannel () {
    client.createDoc(chunter.class.Channel, core.space.Model, {
      name,
      description,
      private: isPrivate,
      direct: false,
      members: [client.accountId()]
    })
  }
</script>

<Card label={chunter.string.CreateChannel} okAction={createChannel} on:close canSave={!!name}>
  <Grid column={1} rowGap={20}>
    <EditBox label={chunter.string.ChannelName} bind:value={name} focus />
    <!-- <TextArea label={chunter.string.ChannelDescription} bind:value={description} /> -->
    <ToggleWithLabel
      label={chunter.string.MakePrivate}
      description={chunter.string.MakePrivateDescription}
      bind:on={isPrivate}
    />
  </Grid>
</Card>
