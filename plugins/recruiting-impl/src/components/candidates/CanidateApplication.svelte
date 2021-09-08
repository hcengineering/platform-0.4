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
  import type { Ref } from '@anticrm/core'
  import type { Applicant, Candidate, VacancySpace } from '@anticrm/recruiting'
  import recruiting from '@anticrm/recruiting'
  import { getClient } from '@anticrm/workbench'
  import { fsmPlugin } from '@anticrm/fsm-impl'
  import type { WithFSM } from '@anticrm/fsm'
  import { getPlugin } from '@anticrm/platform'
  import { Button, PopupItem, PopupMenu } from '@anticrm/ui'
  import type { QueryUpdater } from '@anticrm/presentation'

  const client = getClient()
  export let candidate: Candidate

  let applications: Set<Ref<WithFSM>> = new Set()
  let lqApplications: QueryUpdater<Applicant> | undefined

  $: lqApplications = client.query(lqApplications, recruiting.class.Applicant, { item: candidate._id }, (result) => {
    applications = new Set(result.map((x) => x.fsm))
  })

  let vacancies: VacancySpace[] = []
  let lqVacancies: QueryUpdater<VacancySpace> | undefined
  $: lqVacancies = client.query(lqVacancies, recruiting.class.VacancySpace, {}, (result) => {
    vacancies = result.filter((x) => x.members.includes(client.accountId()))
  })

  let appliedVacancies: VacancySpace[] = []
  let availableVacancies: VacancySpace[] = []

  $: {
    appliedVacancies = vacancies.filter((x) => applications.has(x._id))
    availableVacancies = vacancies.filter((x) => !applications.has(x._id))
  }

  async function assign (vacancy: VacancySpace) {
    if (!candidate) {
      return
    }

    const fsmP = await getPlugin(fsmPlugin.id)
    await fsmP.addItem(vacancy, {
      _class: recruiting.class.Applicant,
      obj: {
        item: candidate._id,
        clazz: recruiting.class.Candidate
      }
    })
  }
</script>

<div class="root">
  {#each appliedVacancies as vacancy}
    <div class="label">{vacancy.name}</div>
    <Button label={recruiting.string.Unassign} />
  {/each}
  {#if availableVacancies.length > 0}
    <div class="create">
      <PopupMenu auto={true}>
        <Button primary label={recruiting.string.CreateApplication} slot="trigger" />
        {#each availableVacancies as v}
          <PopupItem action={() => assign(v)} title={v.name} />
        {/each}
      </PopupMenu>
    </div>
  {/if}
</div>

<style lang="scss">
  .root {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 5px;
  }

  .label {
    display: flex;
    align-items: center;
  }

  .create {
    display: flex;
    align-items: center;
    width: 100%;
  }
</style>
