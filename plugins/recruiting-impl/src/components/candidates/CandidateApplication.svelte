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
  import type { Account, Ref } from '@anticrm/core'
  import type { Applicant, Candidate, VacancySpace } from '@anticrm/recruiting'
  import recruiting from '@anticrm/recruiting'
  import { getClient } from '@anticrm/workbench'
  import type { State } from '@anticrm/fsm'
  import { Header, Label, showPopup, Table, UserInfo } from '@anticrm/ui'
  import type { QueryUpdater } from '@anticrm/presentation'
  import CreateApplication from './CreateApplication.svelte'
  import fsm from '@anticrm/fsm'
  import core from '@anticrm/core'
  import StateViewer from '../applicants/StateViewer.svelte'

  const client = getClient()
  export let candidate: Candidate

  let applications: Applicant[] = []
  let lqApplications: QueryUpdater<Applicant> | undefined

  $: lqApplications = client.query(
    lqApplications,
    recruiting.class.Applicant,
    { _id: { $in: candidate.applicants } },
    (result) => {
      applications = result
    }
  )

  let vacancies: VacancySpace[] = []
  let lqVacancies: QueryUpdater<VacancySpace> | undefined
  $: lqVacancies = client.query(
    lqVacancies,
    recruiting.class.VacancySpace,
    { _id: { $in: applications.map((s) => s.space as Ref<VacancySpace>) } },
    (result) => {
      vacancies = result
    }
  )

  let states: State[] = []
  let stateQ: QueryUpdater<State> | undefined
  $: stateQ = client.query(
    stateQ,
    fsm.class.State,
    { _id: { $in: applications.map((s) => s.state as Ref<State>) } },
    (result) => {
      states = result
    }
  )

  let recruiters: Account[] = []
  let recruitersQ: QueryUpdater<Account> | undefined
  $: recruitersQ = client.query(
    recruitersQ,
    core.class.Account,
    { _id: { $in: applications.map((s) => s.recruiter as Ref<Account>) } },
    (result) => {
      recruiters = result
    }
  )

  $: data = generateItems(applications, vacancies, states)

  function create () {
    showPopup(CreateApplication, { candidate: candidate })
  }

  interface ApplicantItem {
    _id: Ref<Applicant>
    vacancy: string
    location: string
    recruiter: Account
    state: State
  }

  function generateItems (applications: Applicant[], vacancies: VacancySpace[], states: State[]): ApplicantItem[] {
    const result: ApplicantItem[] = []
    for (const applicant of applications) {
      const vacancy = vacancies.find((v) => v._id === applicant.space)
      if (vacancy === undefined) continue
      const state = states.find((v) => v._id === applicant.state)
      if (state === undefined) continue
      const recruiter = recruiters.find((v) => v._id === applicant.recruiter)
      if (recruiter === undefined) continue
      const item = {
        _id: applicant._id,
        vacancy: vacancy.name,
        location: vacancy.location,
        recruiter: recruiter,
        state
      }
      result.push(item)
    }
    return result
  }

  const columns = [
    { label: recruiting.string.Vacancy, properties: [{ key: 'vacancy', property: 'label' }], component: Label },
    { label: recruiting.string.Location, properties: [{ key: 'location', property: 'label' }], component: Label },
    {
      label: recruiting.string.Recruiter,
      properties: [{ key: 'recruiter', property: 'user' }],
      component: UserInfo
    },
    { label: recruiting.string.State, properties: [{ key: 'state', property: 'state' }], component: StateViewer }
  ]
</script>

<Header label={recruiting.string.Applications} addHandler={create} />
{#if data.length}
  <Table {data} {columns} showHeader virtual={false} />
{/if}
