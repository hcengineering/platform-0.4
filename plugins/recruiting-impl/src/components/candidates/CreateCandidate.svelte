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
  import type { Data, Space } from '@anticrm/core'
  import { Dialog } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import type { Candidate } from '@anticrm/recruiting'
  import { CandidateStatus } from '@anticrm/recruiting'
  import recruiting from '@anticrm/recruiting'

  import CandidateEditor from './CandidateEditor.svelte'

  const dispatch = createEventDispatcher()

  export let space: Space
  const client = getClient()

  const candidate: Candidate & Data<Required<Candidate>> = {
    firstName: '',
    lastName: '',
    avatar: 'https://robohash.org/prefix?set=set4',
    email: '',
    phone: '',
    bio: '',
    status: CandidateStatus.AvailableForHire,
    employment: {
      position: '',
      experience: 0
    },
    address: {
      city: '',
      country: '',
      street: '',
      zip: ''
    },
    salaryExpectation: 0,
    resume: ''
  } as Candidate & Data<Required<Candidate>>

  async function create () {
    await client.createDoc(recruiting.class.Candidate, space._id, candidate)
  }
</script>

<Dialog
  label={recruiting.string.AddCandidate}
  okLabel={recruiting.string.AddCandidate}
  okAction={create}
  on:close={() => dispatch('close')}
>
  <CandidateEditor {candidate} />
</Dialog>
