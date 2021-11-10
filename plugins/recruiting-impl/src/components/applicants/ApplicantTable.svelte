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
  import type { Applicant, VacancySpace } from '@anticrm/recruiting'
  import recruiting from '@anticrm/recruiting'
  import type { QueryUpdater } from '@anticrm/presentation'
  import { closePopup, Label, showPopup, Table } from '@anticrm/ui'
  import ApplicantPresenter from './ApplicantPresenter.svelte'

  export let space: VacancySpace
  let prevSpace: Ref<Space> | undefined

  const client = getClient()

  // May look similar to candidate table definition
  // but it's gonna get updated eventually
  const columns = [
    {
      label: recruiting.string.FirstName,
      properties: [{ key: 'candidateData.firstName', property: 'label' }],
      component: Label
    },
    {
      label: recruiting.string.LastName,
      properties: [{ key: 'candidateData.lastName', property: 'label' }],
      component: Label
    }
  ]

  function onClick (event: any) {
    showPopup(ApplicantPresenter, { id: event.detail._id }, 'full', () => {
      closePopup()
    })
  }

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
</script>

<Table data={applicants} {columns} on:rowClick={onClick} showHeader />
