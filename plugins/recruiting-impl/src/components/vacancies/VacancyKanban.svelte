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
  import { SortingOrder } from '@anticrm/core'
  import { getPlugin } from '@anticrm/platform'
  import { getClient } from '@anticrm/workbench'
  import fsmPlugin from '@anticrm/fsm'
  import type { FSM, State } from '@anticrm/fsm'
  import recruiting from '@anticrm/recruiting'
  import type { QueryUpdater } from '@anticrm/presentation'
  import type { Applicant, VacancySpace } from '@anticrm/recruiting'
  import { Kanban } from '@anticrm/ui'

  import ApplicantCard from '../applicants/ApplicantCard.svelte'
  import { ApplicantUIModel, StateUIModel } from '../..'
  import action, { Action } from '@anticrm/action-plugin'
  import { NotificationClient, SpaceLastViews } from '@anticrm/notification'
  import { getContext } from 'svelte'
  import { Writable } from 'svelte/store'

  export let space: VacancySpace
  let prevSpace: Ref<Space> | undefined

  const client = getClient()
  const notificationClient = new NotificationClient(client)
  const spacesLastViews = getContext('spacesLastViews') as Writable<Map<Ref<Space>, SpaceLastViews>>
  const fsmP = getPlugin(fsmPlugin.id)
  let lqStates: QueryUpdater<State> | undefined
  let lqApplicants: QueryUpdater<Applicant> | undefined

  let fsm: FSM | undefined
  let lqFSM: QueryUpdater<FSM> | undefined

  const colors = [
    'var(--color-blue-01)',
    'var(--color-blue-02)',
    'var(--color-purple-01)',
    'var(--color-purple-02)',
    'var(--color-green-01)',
    'var(--color-green-02)',
    'var(--color-green-03)',
    'var(--color-grey)',
    'var(--color-orange)'
  ]

  $: if (space._id !== prevSpace) {
    prevSpace = space._id
    fsm = undefined

    if (space !== undefined) {
      lqFSM = client.query(lqFSM, fsmPlugin.class.FSM, { space: space._id }, (result) => {
        fsm = result[0]
      }, { limit: 1 })
    } else {
      lqFSM?.unsubscribe()
      lqFSM = undefined
      fsm = undefined
    }
  }

  $: if (fsm !== undefined) {
    lqStates = client.query(
      lqStates,
      fsmPlugin.class.State,
      { fsm: fsm._id },
      (result) => {
        states = result
        console.log(result)
      },
      {
        sort: {
          rank: SortingOrder.Ascending
        }
      }
    )
  } else {
    lqStates?.unsubscribe()
    lqStates = undefined
    states = []
  }

  let applicants: Applicant[] = []
  let actions: Action[] = []
  let actionsQuery: QueryUpdater<Action> | undefined
  $: actionsQuery =
    states.length > 0
      ? client.query(
        actionsQuery,
        action.class.Action,
        {
          _id: { $in: states.map((s) => s.optionalActions.concat(s.requiredActions)).reduce((r, x) => r.concat(x)) }
        },
        (res) => (actions = res)
      )
      : undefined

  $: lqApplicants = client.query(
    lqApplicants,
    recruiting.class.Applicant,
    { space: space._id },
    (result) => (applicants = result),
    {
      sort: {
        rank: SortingOrder.Ascending
      }
    }
  )

  async function onDrop (event: CustomEvent<any>) {
    const { item, state, prevState, idx } = event.detail
    const actualItem = items.get(prevState)?.find((x) => x._id === item)
    const targetItems = items.get(state)

    if (actualItem === undefined || targetItems === undefined) {
      return
    }

    const fsm = await fsmP
    const prev = targetItems[idx - 1]
    const next = targetItems[idx]

    await fsm.moveItem(actualItem, state, { prev, next })
    const spaceLastViews = $spacesLastViews.get(actualItem!.space)
    if (spaceLastViews !== undefined) {
      await notificationClient.readNow(spaceLastViews, actualItem!._id, true)
    }
  }

  async function onStateReorder (event: CustomEvent<any>) {
    const { item, idx } = event.detail
    const actualItem = states.find((x) => x._id === item)

    if (actualItem === undefined) {
      return
    }

    const prev = states[idx - 1]
    const next = states[idx]

    const fsm = await fsmP
    await fsm.moveState(actualItem, { prev, next })
  }

  async function onAddNewColumn () {
    if (fsm === undefined) {
      return
    }

    const existingColors = new Set(states.map(x => x.color))
    const color = colors.filter(x => !existingColors.has(x))[0] ?? 'var(--color-grey)'

    const fsmPlug = await fsmP
    await fsmPlug.addState({
      fsm: fsm._id,
      name: 'New column',
      optionalActions: [],
      requiredActions: [],
      color
    })
  }

  async function onColumnRename (event: CustomEvent<any>) {
    if (fsm === undefined) {
      return
    }
  
    const { id, title } = event.detail

    await client.updateDoc(fsmPlugin.class.State, fsm.space, id, {
      name: title
    })
  }

  async function onColumnEdit (event: CustomEvent<any>) {
    const state = states.find((x) => x._id === event.detail.id)

    if (state === undefined) {
      return
    }

    const fsmPlug = await fsmP
    await fsmPlug.removeState(state)
  }

  let states: State[] = []

  $: items = getData(applicants, states, actions)

  function getData (applicants: Applicant[], states: State[], actions: Action[]): Map<string, ApplicantUIModel[]> {
    const result: Map<string, ApplicantUIModel[]> = new Map<string, ApplicantUIModel[]>()
    for (const state of states) {
      const stateData: StateUIModel = {
        ...state,
        _id: state._id as Ref<StateUIModel>,
        optionalActionsData: actions.filter((a) => state.optionalActions.includes(a._id)),
        requiredActionsData: actions.filter((a) => state.requiredActions.includes(a._id))
      }
      const currentApplicants = applicants.filter((a) => a.state === state._id)
      const res = currentApplicants.map((a) => ({
        ...a,
        _id: a._id as Ref<ApplicantUIModel>,
        stateData: stateData
      }))
      result.set(state._id, res)
    }
    return result
  }
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
  on:columnEdit={onColumnEdit}
/>
