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
  import { Ref } from '@anticrm/core'
  import recruiting, { Applicant } from '@anticrm/recruiting'
  import { IconFile, showPopup } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import ApplitcantsPopup from './ApplitcantsPopup.svelte'

  export let applicants: Ref<Applicant>[]
  const client = getClient()

  async function open (e: MouseEvent): Promise<void> {
    if (applicants.length > 0) {
      e.stopPropagation()
      const items = await client.findAll(recruiting.class.Applicant, { _id: { $in: applicants } })
      showPopup(ApplitcantsPopup, { applicants: items }, e.target as HTMLElement)
    }
  }
</script>

<div class="flex-row-center" on:click={open}>
  <IconFile />
  {applicants.length}
</div>
