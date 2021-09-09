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
  import type { Doc, Ref, Space } from '@anticrm/core'
  import { EditBox, Dialog, TextArea } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import type { Candidate, Resume } from '@anticrm/recruiting'
  import recruiting from '@anticrm/recruiting'

  const dispatch = createEventDispatcher()

  export let space: Space
  const client = getClient()

  const candidate: Omit<Candidate, keyof Doc> = {
    name: '',
    bio: '',
    position: '',
    location: '',
    resume: '' as Ref<Resume>
  }

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
  <div class="content">
    <EditBox label={recruiting.string.Name} bind:value={candidate.name} />
    <TextArea label={recruiting.string.Bio} bind:value={candidate.bio} />
    <EditBox label={recruiting.string.Position} bind:value={candidate.position} />
    <EditBox label={recruiting.string.Location} bind:value={candidate.location} />
  </div>
</Dialog>

<style lang="scss">
  .content {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
</style>
