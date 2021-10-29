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
  import type { Ref, Space } from '@anticrm/core'
  import core from '@anticrm/core'
  import { getPlugin } from '@anticrm/platform'
  import { getClient } from '@anticrm/workbench'
  import { fsmPlugin } from '@anticrm/fsm-impl'
  import type { FSM, State } from '@anticrm/fsm'
  import recruiting from '@anticrm/recruiting'
  import type { QueryUpdater } from '@anticrm/presentation'
  import type { Applicant, VacancySpace } from '@anticrm/recruiting'
  import { Kanban } from '@anticrm/ui'

  import ApplicantCard from './ApplicantCard.svelte'

  export let space: VacancySpace
  let prevSpace: Ref<Space> | undefined

  const client = getClient()
  const fsmP = getPlugin(fsmPlugin.id)
  let lqApplicants: QueryUpdater<Applicant> | undefined
  let lqStates: QueryUpdater<State> | undefined

  let fsm: FSM | undefined
  let lqFSM: QueryUpdater<FSM> | undefined

  $: if (space._id !== prevSpace) {
    prevSpace = space._id

    if (space !== undefined) {
      lqApplicants = client.query(lqApplicants, recruiting.class.Applicant, { space: space._id }, (result) => {
        applicants = result.map((x) => ({
          ...x,
          id: x._id
        }))
      })

      lqStates = client.query(lqStates, fsmPlugin.class.State, { fsm: space.fsm }, (result) => {
        rawStates = result
      })

      lqFSM = client.query(lqFSM, fsmPlugin.class.FSM, { _id: space.fsm }, (result) => {
        fsm = result[0]
      })
    }
  }

  async function onDrop (event: CustomEvent<any>) {
    const { item, state, idx } = event.detail
    const actualItem = applicants.find((x) => x._id === item)

    if (!actualItem) {
      return
    }

    const fsm = await fsmP

    await fsm.moveItem(actualItem, { prev: actualItem.state, actual: state }, idx)
  }

  async function onStateReorder (event: CustomEvent<any>) {
    if (fsm === undefined) {
      return
    }

    const { item, idx } = event.detail
    const updatedStates = [...fsm.states.slice(0, idx), item, ...fsm.states.slice(idx)].filter(
      (x, i) => x !== item || i === idx
    )

    await client.updateDoc(fsmPlugin.class.FSM, core.space.Model, space.fsm, {
      states: updatedStates
    })
  }

  async function onAddNewColumn () {
    if (fsm === undefined) {
      return
    }

    const fsmPlug = await fsmP
    await fsmPlug.addState({
      fsm: fsm._id,
      items: [],
      name: 'New column',
      optionalActions: [],
      requiredActions: [],
      color: '#000000'
    })
  }

  async function onColumnRename (event: CustomEvent<any>) {
    const { id, title } = event.detail

    await client.updateDoc(fsmPlugin.class.State, core.space.Model, id, {
      name: title
    })
  }

  async function onColumnRemove (event: CustomEvent<any>) {
    const state = states.find((x) => x._id === event.detail.id)

    if (state === undefined) {
      return
    }

    const fsmPlug = await fsmP
    await fsmPlug.removeState(state)
  }

  let applicants: Applicant[] = []
  let rawStates: State[] = []

  let items = new Map<string, Applicant[]>()
  $: items = new Map<string, Applicant[]>(
    rawStates.map(
      (state) =>
        [
          state._id,
          state.items
            .map((itemID) => applicants.find((x) => x._id === itemID))
            .filter((item): item is Applicant => item !== undefined)
        ] as [string, Applicant[]]
    )
  )

  let states: State[] = []
  $: states =
    fsm?.states.map((stateID) => rawStates.find((x) => x._id === stateID)).filter((x): x is State => x !== undefined) ??
    []
</script>

<Kanban
  {items}
  {states}
  cardDelay={100}
  cardComponent={ApplicantCard}
  on:drop={onDrop}
  on:stateReorder={onStateReorder}
  on:columnAdd={onAddNewColumn}
  on:columnRename={onColumnRename}
  on:columnRemove={onColumnRemove}
/>
