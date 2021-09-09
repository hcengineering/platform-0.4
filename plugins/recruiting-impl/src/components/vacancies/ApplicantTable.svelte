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
  import { Table, Label } from '@anticrm/ui'
  import type { Ref, Space } from '@anticrm/core'
  import { getClient } from '@anticrm/workbench'
  import type { Applicant, Candidate, VacancySpace } from '@anticrm/recruiting'
  import recruiting from '@anticrm/recruiting'
  import type { QueryUpdater } from '@anticrm/presentation'

  export let space: VacancySpace
  let prevSpace: Ref<Space> | undefined

  // May look similar to candidate table definition
  // but it's gonna get updated eventually
  const columns = [
    {
      label: recruiting.string.Name,
      properties: [{ key: 'name', property: 'label' }],
      component: Label
    },
    {
      label: recruiting.string.Position,
      properties: [{ key: 'position', property: 'label' }],
      component: Label
    },
    {
      label: recruiting.string.Location,
      properties: [{ key: 'location', property: 'label' }],
      component: Label
    }
  ]

  const client = getClient()
  let applicants: Applicant[] = []
  let lqApplicants: QueryUpdater<Applicant> | undefined
  $: if (space._id !== prevSpace) {
    prevSpace = space._id

    if (space !== undefined) {
      lqApplicants = client.query(lqApplicants, recruiting.class.Applicant, { space: space._id }, (result) => {
        applicants = result
      })
    }
  }

  $: candidateIDs = applicants.map((a) => a.item as Ref<Candidate>)

  let candidates: Map<string, Candidate> = new Map()
  let lqCandidates: QueryUpdater<Candidate> | undefined

  $: {
    lqCandidates = client.query(lqCandidates, recruiting.class.Candidate, { _id: { $in: candidateIDs } }, (result) => {
      candidates = new Map(result.map((x) => [x._id, x]))
    })
  }

  $: data = applicants.map((x) => candidates.get(x.item)).filter((x): x is Candidate => x !== undefined)
</script>

<Table {data} {columns} showHeader />
