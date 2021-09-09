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
  import { getClient } from '@anticrm/workbench'
  import type { State } from '@anticrm/fsm'
  import { fsmPlugin as fsm } from '@anticrm/fsm-impl'
  import recruiting from '@anticrm/recruiting'
  import type { QueryUpdater } from '@anticrm/presentation'

  import { Kanban } from '@anticrm/ui'
  import ApplicantCard from './ApplicantCard.svelte'
  import type { Applicant, VacancySpace } from '@anticrm/recruiting'

  export let space: VacancySpace
  let prevSpace: Ref<Space> | undefined

  const client = getClient()

  let lqApplicants: QueryUpdater<Applicant> | undefined
  let lqStates: QueryUpdater<State> | undefined

  $: if (space._id !== prevSpace) {
    prevSpace = space._id

    if (space !== undefined) {
      lqApplicants = client.query(lqApplicants, recruiting.class.Applicant, { space: space._id }, (result) => {
        items = result
      })

      lqStates = client.query(lqStates, fsm.class.State, { fsm: space.fsm }, (result) => {
        states = result
      })
    }
  }

  async function onDrop (event: CustomEvent<any>) {
    if (space === undefined) {
      return
    }

    const { item, state } = event.detail

    await client.updateDoc(recruiting.class.Applicant, space._id, item, { state })
  }

  let items: Applicant[] = []
  let states: State[] = []
</script>

<Kanban {items} {states} cardComponent={ApplicantCard} on:drop={onDrop} />
