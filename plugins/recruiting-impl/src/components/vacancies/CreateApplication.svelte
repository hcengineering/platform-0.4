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
  import core, { Account, Ref } from '@anticrm/core'
  import { getPlugin } from '@anticrm/platform'
  import { Card, Grid, UserBox, Dropdown } from '@anticrm/ui'
  import type { DropdownItem } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import type { Applicant, Candidate, VacancySpace } from '@anticrm/recruiting'
  import recruiting from '@anticrm/recruiting'
  import type { FSM, State } from '@anticrm/fsm'
  import { fsmPlugin } from '@anticrm/fsm-impl'
  import type { QueryUpdater } from '@anticrm/presentation'

  export let space: VacancySpace
  const client = getClient()
  const dispatch = createEventDispatcher()

  let fsm: FSM | undefined
  let fsmQ: QueryUpdater<FSM> | undefined
  $: fsmQ = client.query(fsmQ, fsmPlugin.class.FSM, { _id: space.fsm }, (res) => (fsm = res[0]))

  let existingCandidates: Set<Ref<Candidate>> | undefined
  let existingCandidatesQ: QueryUpdater<Applicant> | undefined

  $: existingCandidatesQ = client.query(
    existingCandidatesQ,
    recruiting.class.Applicant,
    { space: space._id },
    (res) => {
      existingCandidates = new Set(res.map((x) => x.item as Ref<Candidate>))
    }
  )

  let states: State[] = []
  let statesQ: QueryUpdater<State> | undefined

  $: statesQ = client.query(statesQ, fsmPlugin.class.State, { fsm: space.fsm }, (res) => (states = res))

  let allCandidates: Candidate[] = []
  let allCandidatesQ: QueryUpdater<Candidate> | undefined

  $: if (existingCandidates !== undefined) {
    allCandidatesQ = client.query(allCandidatesQ, recruiting.class.Candidate, {}, (res) => {
      allCandidates = res.filter((x) => !existingCandidates?.has(x._id))
    })
  }

  let userBoxCandidates: Account[] = []
  $: userBoxCandidates = allCandidates.map((x) => ({
    ...x,
    _id: x._id as never as Ref<Account>,
    name: [x.firstName, x.lastName].filter((x) => x !== undefined && x.length > 0).join(' ')
  }))

  let candidate: Ref<Account> | undefined

  let recruiters: Account[] = []
  let recruitersQ: QueryUpdater<Account> | undefined
  $: recruitersQ = client.query(
    recruitersQ,
    core.class.Account,
    { _id: { $in: space.members } },
    (res) => (recruiters = res)
  )

  let recruiter: Ref<Account> | undefined
  let stateItems: DropdownItem[] = []
  $: if (fsm !== undefined) {
    stateItems = fsm.states
      .map((id) => states.find((s) => s._id === id))
      .filter((s): s is State => s !== undefined)
      .map((s) => ({
        id: s._id,
        label: s.name
      }))
  }

  let stateID: string | undefined

  async function create () {
    if (candidate === undefined || recruiter === undefined || stateID === undefined) {
      return
    }

    const fsmP = await getPlugin(fsmPlugin.id)
    await fsmP.addItem(space, {
      _class: recruiting.class.Applicant,
      obj: {
        item: candidate as never as Ref<Candidate>,
        clazz: recruiting.class.Candidate,
        recruiter,
        state: stateID as Ref<State>,
        comments: []
      }
    })
  }

  let canSave: boolean = false
  $: canSave = !!(recruiter && candidate)
</script>

<Card label={recruiting.string.CreateApplication} bind:canSave okAction={create} on:close={() => dispatch('close')}>
  <Grid column={1} rowGap={24}>
    <UserBox
      users={recruiters}
      bind:selected={recruiter}
      label={recruiting.string.Recruiter}
      title={recruiting.string.AssignRecruiter}
      showSearch
    />
    <UserBox
      users={userBoxCandidates}
      bind:selected={candidate}
      label={recruiting.string.Candidate}
      title={recruiting.string.SelectCandidate}
      showSearch
    />
    <Dropdown items={stateItems} bind:selected={stateID} title={recruiting.string.State} />
  </Grid>
</Card>
