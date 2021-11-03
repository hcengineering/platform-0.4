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
  import core, { SortingOrder } from '@anticrm/core'
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
  let lqStates: QueryUpdater<State> | undefined
  const lqApplicantsMap: Map<Ref<State>, QueryUpdater<Applicant>> = new Map()

  let fsm: FSM | undefined
  let lqFSM: QueryUpdater<FSM> | undefined

  $: if (space._id !== prevSpace) {
    prevSpace = space._id

    if (space !== undefined) {
      lqStates = client.query(
        lqStates,
        fsmPlugin.class.State,
        { fsm: space.fsm },
        (result) => {
          states = result
        },
        {
          sort: {
            rank: SortingOrder.Ascending
          }
        }
      )

      lqFSM = client.query(lqFSM, fsmPlugin.class.FSM, { _id: space.fsm }, (result) => {
        fsm = result[0]
      })
    } else {
      lqFSM?.unsubscribe()
      fsm = undefined

      lqStates?.unsubscribe()
      states = []
    }
  }

  $: {
    const stateIDs = states.map((x) => x._id)
    const ss = new Set(stateIDs)

    const missingQueryKeys = [...lqApplicantsMap.keys()].filter((x) => !ss.has(x))
    missingQueryKeys.forEach((k) => {
      lqApplicantsMap.get(k)?.unsubscribe()
      lqApplicantsMap.delete(k)
    })

    const missingItemsKeys = [...items.keys()].filter((x) => !ss.has(x as Ref<State>))
    missingItemsKeys.forEach((k) => {
      items.delete(k)
    })

    items = items

    const curQueryKeys = [...lqApplicantsMap.keys()]
    const newStates = stateIDs.filter((x) => !curQueryKeys.includes(x))

    newStates.forEach((state) => {
      lqApplicantsMap.set(
        state,
        client.query(
          undefined,
          recruiting.class.Applicant,
          { state },
          (result) => {
            const applicants = result.map((x) => ({
              ...x,
              id: x._id
            }))
            items.set(state, applicants)

            items = items
          },
          {
            sort: {
              rank: SortingOrder.Ascending
            }
          }
        )
      )
    })
  }

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

    const fsmPlug = await fsmP
    await fsmPlug.addState({
      fsm: fsm._id,
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

  let states: State[] = []
  let items = new Map<string, Applicant[]>()
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
