<!--
// Copyright © 2021 Anticrm Platform Contributors.
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
  import { createEventDispatcher } from 'svelte'
  import core from '@anticrm/core'
  import type { Doc } from '@anticrm/core'
  import { EditBox, Card, Grid, ToggleWithLabel } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import type { CandidatePoolSpace } from '@anticrm/recruiting'
  import recruiting from '@anticrm/recruiting'

  const client = getClient()
  const dispatch = createEventDispatcher()

  const pool: Omit<CandidatePoolSpace, keyof Doc> = {
    name: '',
    description: '',
    private: false,
    members: [client.accountId()]
  }

  async function createPool () {
    await client.createDoc(recruiting.class.CandidatePoolSpace, core.space.Model, pool)
  }
</script>

<Card
  label={recruiting.string.AddPoolSpace}
  okLabel={recruiting.string.Save}
  okAction={createPool}
  on:close
  canSave={!!pool.name}
  on:update={(ev) => {
    dispatch('update', ev.detail)
  }}
>
  <Grid column={1} rowGap={20}>
    <EditBox label={recruiting.string.Name} bind:value={pool.name} focus />
    <!-- <TextArea label={recruiting.string.Description} bind:value={pool.description} /> -->
    <ToggleWithLabel
      label={recruiting.string.MakePrivate}
      description={recruiting.string.MakePrivateDescription}
      bind:on={pool.private}
    />
  </Grid>
</Card>
