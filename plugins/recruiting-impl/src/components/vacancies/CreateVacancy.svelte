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
  import { onDestroy } from 'svelte'

  import core, { Doc } from '@anticrm/core'
  import { getPlugin } from '@anticrm/platform'
  import { EditBox, Dialog, ToggleWithLabel, TextArea } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import { VacancySpace } from '@anticrm/recruiting'
  import { FSM } from '@anticrm/fsm'
  import fsmPlugin from '@anticrm/fsm-impl/src/plugin'

  import recruiting from '../../plugin'

  const client = getClient()
  let selectedFSM: FSM | undefined = undefined
  let fsmTmpls: FSM[] = []
  const fsmUnsub = client.query(
    fsmPlugin.class.FSM,
    { clazz: recruiting.class.VacancySpace, isTemplate: true },
    (result) => {
      fsmTmpls = result
      if (selectedFSM === undefined) {
        selectedFSM = result[0]
      }
    }
  )

  onDestroy(() => {
    fsmUnsub()
  })

  const vacancy: Omit<VacancySpace, keyof Doc> = {
    name: '',
    description: '',
    company: '',
    location: '',
    fsm: '' as VacancySpace['fsm'],
    private: false,
    salary: 0,
    members: [client.accountId()]
  }

  async function createVacancy () {
    if (!selectedFSM) {
      return
    }

    const fsmP = await getPlugin(fsmPlugin.id)
    const dFSM = await fsmP.duplicateFSM(selectedFSM._id)

    if (!dFSM) {
      return
    }

    client.createDoc(recruiting.class.VacancySpace, core.space.Model, {
      ...vacancy,
      fsm: dFSM._id
    })
  }
</script>

<Dialog label={recruiting.string.AddVacancy} okLabel={recruiting.string.AddVacancy} okAction={createVacancy} on:close>
  <div class="content">
    <EditBox label={recruiting.string.Name} bind:value={vacancy.name} />
    <TextArea label={recruiting.string.Description} bind:value={vacancy.description} />
    <EditBox label={recruiting.string.Company} bind:value={vacancy.company} />
    <ToggleWithLabel
      label={recruiting.string.MakePrivate}
      description={recruiting.string.MakePrivateDescription}
      bind:on={vacancy.private}
    />
  </div>
</Dialog>

<style lang="scss">
  .content {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
</style>
