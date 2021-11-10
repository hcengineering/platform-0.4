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
  import core from '@anticrm/core'
  import type { Account, Doc, Ref } from '@anticrm/core'
  import { getClient } from '@anticrm/workbench'
  import type { QueryUpdater } from '@anticrm/presentation'
  import { Grid, UserInfo } from '@anticrm/ui'
  import type { DerivedFeedback } from '@anticrm/recruiting'
  import recruiting from '@anticrm/recruiting'

  export let target: Ref<Doc>
  export let users: Ref<Account>[]
  const client = getClient()

  let feedback: DerivedFeedback[] = []
  let feedbackQ: QueryUpdater<DerivedFeedback> | undefined
  $: feedbackQ = client.query(
    feedbackQ,
    recruiting.class.DerivedFeedback,
    { parent: target },
    (res) => (feedback = res)
  )

  let accounts: Account[] = []
  let accountsQ: QueryUpdater<Account> | undefined
  $: accountsQ = client.query(accountsQ, core.class.Account, { _id: { $in: users } }, (res) => (accounts = res))

  let feedbackByAcc = new Map<Ref<Account>, DerivedFeedback>()
  $: feedbackByAcc = new Map(feedback.map((x) => [x.modifiedBy, x] as [Ref<Account>, DerivedFeedback]))
</script>

<Grid column={1} rowGap={10}>
  {#each accounts as user (user._id)}
    <div class="feedback">
      <UserInfo {user} />
      <div class="feedback">
        {feedbackByAcc.get(user._id)?.feedback ?? 'None'}
      </div>
    </div>
  {/each}
</Grid>
