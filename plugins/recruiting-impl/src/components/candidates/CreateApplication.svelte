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
  import core, { Account, getFullRef, Ref, Space } from '@anticrm/core'
  import { getPlugin } from '@anticrm/platform'
  import { Card, Grid, UserBox, Dropdown } from '@anticrm/ui'
  import type { DropdownItem } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import type { Applicant, Candidate, VacancySpace } from '@anticrm/recruiting'
  import recruiting from '@anticrm/recruiting'
  import type { FSM, State } from '@anticrm/fsm'
  import fsmPlugin from '@anticrm/fsm'
  import type { QueryUpdater } from '@anticrm/presentation'
  import { NotificationClient, SpaceLastViews } from '@anticrm/notification'
  import { getContext } from 'svelte'
  import { Writable } from 'svelte/store'

  export let candidate: Candidate
  let space: VacancySpace | undefined

  const client = getClient()
  const accountId = client.accountId()
  const dispatch = createEventDispatcher()
  const notificationClient = new NotificationClient(client)
  const spacesLastViews = getContext('spacesLastViews') as Writable<Map<Ref<Space>, SpaceLastViews>>
  $: spaceLastViews = space !== undefined ? $spacesLastViews.get(space._id) : undefined

  let applicants: Applicant[] = []
  let applicantsLoaded = false
  let applicantsQ: QueryUpdater<Applicant> | undefined
  $: applicantsQ = client.query(
    applicantsQ,
    recruiting.class.Applicant,
    { _id: { $in: candidate.applicants } },
    (res) => {
      applicants = res
      applicantsLoaded = true
    }
  )

  let fsm: FSM | undefined
  let fsmQ: QueryUpdater<FSM> | undefined
  $: if (space !== undefined) {
    fsmQ = client.query(fsmQ, fsmPlugin.class.FSM, { space: space._id }, (res) => (fsm = res[0]), { limit: 1 })
  } else {
    fsmQ?.unsubscribe()
    fsmQ = undefined
    fsm = undefined
  }

  let states: State[] = []
  let statesQ: QueryUpdater<State> | undefined

  $: if (fsm?._id !== undefined) {
    statesQ = client.query(statesQ, fsmPlugin.class.State, { fsm: fsm._id }, (res) => (states = res))
  } else {
    statesQ?.unsubscribe()
    statesQ = undefined
    states = []
  }

  let recruiters: Account[] = []
  let recruitersQ: QueryUpdater<Account> | undefined
  $: recruitersQ =
    space && client.query(recruitersQ, core.class.Account, { _id: { $in: space.members } }, (res) => (recruiters = res))

  let recruiter: Ref<Account> | undefined
  let stateItems: DropdownItem[] = []
  $: if (fsm !== undefined) {
    if (stateID !== undefined && states.findIndex((s) => s._id === stateID) === -1) {
      stateID = undefined
    }
    stateItems = states.map((s) => ({
      id: s._id,
      label: s.name
    }))
  }

  let stateID: string | undefined

  async function create () {
    if (fsm === undefined || space === undefined || recruiter === undefined || stateID === undefined) {
      return
    }

    const fsmP = await getPlugin(fsmPlugin.id)
    const application = await fsmP.addItem(fsm._id, {
      _class: recruiting.class.Applicant,
      obj: {
        item: candidate._id,
        clazz: recruiting.class.Candidate,
        recruiter,
        state: stateID as Ref<State>,
        candidate: getFullRef(candidate._id, recruiting.class.Candidate),
        comments: [],
        attachments: [],
        candidateData: {
          location: candidate.address.city,
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          avatar: candidate.avatar
        }
      }
    })

    if (spaceLastViews !== undefined && application !== undefined) {
      await notificationClient.readNow(spaceLastViews, application._id, true)
    }
  }

  let selectedVacancy: Ref<VacancySpace> | undefined
  let vacancies: VacancySpace[] = []
  $: space = selectedVacancy && vacancies.find((v) => v._id === selectedVacancy)
  let vacancyItems: DropdownItem[] = []
  let vacanciesQ: QueryUpdater<VacancySpace> | undefined
  $: vacanciesQ = client.query(vacanciesQ, recruiting.class.VacancySpace, {}, (res) => {
    vacancies = res.filter((space) => !space.private || space.members.includes(accountId))
    vacancyItems = vacancies.map((v) => ({
      id: v._id,
      label: v.name
    }))
  })

  $: if (fsm !== undefined) {
    stateItems = states.map((s) => ({
      id: s._id,
      label: s.name
    }))
  }

  let canSave: boolean = false
  $: canSave = !!(recruiter && candidate && stateID)

  $: items = applicantsLoaded
    ? vacancyItems.filter((item) => !applicants.map((app) => app.space).includes(item.id as Ref<Space>))
    : []
</script>

<Card label={recruiting.string.CreateApplication} bind:canSave okAction={create} on:close={() => dispatch('close')}>
  <Grid column={1} rowGap={24}>
    <Dropdown {items} bind:selected={selectedVacancy} label={recruiting.string.Vacancies} />
    <UserBox
      users={recruiters}
      bind:selected={recruiter}
      label={recruiting.string.Recruiter}
      title={recruiting.string.AssignRecruiter}
      showSearch
    />
  </Grid>
  <Dropdown slot="pool" items={stateItems} bind:selected={stateID} label={recruiting.string.State} />
</Card>
