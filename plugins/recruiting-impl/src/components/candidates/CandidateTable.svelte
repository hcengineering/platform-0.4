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
  import { Table, Label, showPopup, closePopup, YesNo } from '@anticrm/ui'
  import type { Doc, Ref, Space } from '@anticrm/core'
  import { getClient } from '@anticrm/workbench'
  import type { Candidate } from '@anticrm/recruiting'
  import recruiting from '@anticrm/recruiting'
  import type { QueryUpdater } from '@anticrm/presentation'
  import attachment from '@anticrm/attachment'
  import chunter from '@anticrm/chunter'

  import EditCandidate from './EditCandidate.svelte'
  import SocialLinks from './SocialLinks.svelte'
  import ApplicantsTableCell from './ApplicantsTableCell.svelte'

  export let currentSpace: Ref<Space> | undefined
  let prevSpace: Ref<Space> | undefined

  const columns = [
    {
      label: recruiting.string.Candidate,
      properties: [{ key: 'fullName', property: 'label' }],
      component: Label
    },
    {
      label: recruiting.string.Location,
      properties: [{ key: 'address.city', property: 'label' }],
      component: Label
    },
    {
      label: recruiting.string.Title,
      properties: [{ key: 'title', property: 'label' }],
      component: Label
    },
    {
      properties: [{ key: 'applicants', property: 'applicants' }],
      component: ApplicantsTableCell
    },
    {
      label: recruiting.string.Onsite,
      properties: [{ key: 'workPreference.onsite', property: 'value' }],
      component: YesNo
    },
    {
      label: recruiting.string.Remote,
      properties: [{ key: 'workPreference.remote', property: 'value' }],
      component: YesNo
    },
    {
      properties: [{ key: 'attachments', property: 'attachments' }],
      component: attachment.component.AttachmentsTableCell
    },
    {
      properties: [{ key: 'comments', property: 'comments' }],
      component: chunter.component.CommentsTableCell
    },
    {
      label: recruiting.string.SocialLinks,
      properties: [{ key: 'socialLinks', property: 'value' }],
      component: SocialLinks
    }
  ]

  const client = getClient()
  let data: Doc[] = []
  let lq: QueryUpdater<Candidate> | undefined
  $: if (currentSpace !== prevSpace) {
    prevSpace = currentSpace

    if (currentSpace !== undefined) {
      lq = client.query(lq, recruiting.class.Candidate, { space: currentSpace }, (result) => {
        data = result.map((c) => {
          return Object.assign(c, { fullName: `${c.firstName} ${c.lastName}` })
        })
      })
    }
  }

  function onClick (event: any) {
    showPopup(EditCandidate, { id: event.detail._id }, 'full', () => {
      closePopup()
    })
  }
</script>

<Table {data} {columns} showHeader on:rowClick={onClick} />
