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
  import type { WorkbenchRoute } from '@anticrm/workbench'
  import { fsmPlugin } from '@anticrm/fsm-impl'
  import type { WithFSM } from '@anticrm/fsm'
  import { getPlugin } from '@anticrm/platform'
  import { getRouter, IconClose, PopupItem, PopupMenu, ScrollBox } from '@anticrm/ui'
  import type { QueryUpdater } from '@anticrm/presentation'

  export let id: Ref<Candidate>

  const client = getClient()
  const router = getRouter<WorkbenchRoute>()
  let candidate: Candidate | undefined
  let lqCandidates: QueryUpdater<Candidate> | undefined

  $: lqCandidates = client.query(lqCandidates, recruiting.class.Candidate, { _id: id }, ([first]) => {
    candidate = first
  })

  let applications: Set<Ref<WithFSM>> = new Set()
  let lqApplications: QueryUpdater<Applicant> | undefined

  $: lqApplications = client.query(lqApplications, recruiting.class.Applicant, { item: id }, (result) => {
    applications = new Set(result.map((x) => x.fsm))
  })

  let vacancies: VacancySpace[] = []
  let lqVacancies: QueryUpdater<VacancySpace> | undefined
  $: lqVacancies = client.query(lqVacancies, recruiting.class.VacancySpace, {}, (result) => {
    vacancies = result
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

  function onClose () {
    router.navigate({ itemId: undefined })
  }
</script>

{#if candidate !== undefined}
  <div class="header">
    <div class="title">
      {candidate.name}
    </div>
    <div class="close" on:click={onClose}>
      <IconClose size={16} />
    </div>
  </div>
  <ScrollBox autoscrollable vertical>
    <div class="content">
      <div class="row">
        <div class="label">Name:</div>
        {candidate.name}
      </div>
      <div class="row">
        <div class="label">Location:</div>
        {candidate.location}
      </div>
      <div class="row">
        <div class="label">Bio:</div>
        {candidate.bio}
      </div>
      <div class="assignment">
        <div class="assignment-content">
          {#if appliedVacancies.length > 0}
            <div>
              <div class="application-label">Candidate is applied for:</div>
              {#each appliedVacancies as vacancy}
                <div class="vacancy">
                  <div class="label">{vacancy.name}</div>
                </div>
              {/each}
            </div>
          {:else}
            <div class="application-label">Candidate is not assigned to any vacancy</div>
          {/if}
          {#if availableVacancies.length > 0}
            <PopupMenu auto={true} hAlign="left">
              <div class="assign-control" slot="trigger">Assign...</div>
              {#each availableVacancies as v}
                <PopupItem action={() => assign(v)} title={v.name} />
              {/each}
            </PopupMenu>
          {/if}
        </div>
      </div>
    </div>
  </ScrollBox>
{/if}

<style lang="scss">
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 20px;
  }

  .title {
    font-weight: 500;
    font-size: 1.25rem;
    color: var(--theme-caption-color);
    user-select: none;
  }

  .close {
    margin-left: 12px;
    opacity: 0.4;
    cursor: pointer;
    &:hover {
      opacity: 1;
    }
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .label {
    font-weight: 500;
  }

  .assignment {
    display: grid;
    grid-template-columns: auto;
    grid-gap: 10px;
  }

  .assignment-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .assign-control {
    font-weight: 400;
    cursor: pointer;
  }

  .vacancy {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
</style>
