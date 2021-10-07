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
  import { PersonSummary, UserBox, Grid, Section, IconFile, IconComments, ScrollBox } from '@anticrm/ui'
  import type { Account, Ref, Space } from '@anticrm/core'
  import core from '@anticrm/core'
  import { getClient } from '@anticrm/workbench'
  import type { Applicant, Candidate } from '@anticrm/recruiting'
  import recruiting from '@anticrm/recruiting'
  import type { QueryUpdater } from '@anticrm/presentation'

  import Comments from '../common/Comments.svelte'

  export let id: Ref<Applicant>

  const client = getClient()
  let applicant: Applicant | undefined
  let lqApplicant: QueryUpdater<Applicant> | undefined
  $: lqApplicant = client.query(lqApplicant, recruiting.class.Applicant, { _id: id }, (result) => {
    applicant = result[0]
  })

  let candidate: Candidate | undefined
  let lqCandidate: QueryUpdater<Candidate> | undefined

  $: if (applicant !== undefined) {
    lqCandidate = client.query(
      lqCandidate,
      recruiting.class.Candidate,
      { _id: applicant.item as Ref<Candidate> },
      (result) => {
        candidate = result[0]
      }
    )
  } else {
    lqCandidate?.unsubscribe()
    candidate = undefined
  }

  let space: Space | undefined
  let spaceQ: QueryUpdater<Space> | undefined
  $: if (applicant !== undefined) {
    spaceQ = client.query(spaceQ, core.class.Space, { _id: applicant.space }, (result) => {
      space = result[0]
    })
  } else {
    spaceQ?.unsubscribe()
    space = undefined
  }

  let recruiters: Account[] = []
  let recruitersQ: QueryUpdater<Account> | undefined
  $: if (space !== undefined) {
    recruitersQ = client.query(
      recruitersQ,
      core.class.Account,
      { _id: { $in: space.members } },
      (res) => (recruiters = res)
    )
  } else {
    recruitersQ?.unsubscribe()
    recruiters = []
  }

  let recruiter: Ref<Account> | undefined
  $: if (recruiter === undefined && applicant !== undefined) {
    recruiter = applicant.recruiter
  }

  // Clear recruiter on id change
  $: if (id !== '') {
    recruiter = undefined
  }
</script>

<ScrollBox vertical>
  {#if applicant !== undefined}
    {#if candidate !== undefined}
      <PersonSummary person={candidate} subtitle={candidate.employment.position} />
    {/if}

    <Section label={recruiting.string.GeneralInformation} icon={IconFile}>
      <Grid column={2}>
        <UserBox
          users={recruiters}
          bind:selected={recruiter}
          label={recruiting.string.Recruiter}
          title={recruiting.string.AssignRecruiter}
          showSearch
        />
      </Grid>
    </Section>
    <Section label={recruiting.string.Comments} icon={IconComments}>
      <Comments target={applicant} />
    </Section>
  {/if}
</ScrollBox>
