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
  import type { Ref } from '@anticrm/core'
  import { getClient } from '@anticrm/workbench'

  import type { Applicant, Candidate } from '@anticrm/recruiting'

  import recruiting from '../../plugin'
  import type { QueryUpdater } from '@anticrm/presentation'

  export let doc: Applicant
  let candidate: Candidate | undefined

  const client = getClient()
  let lq: QueryUpdater<Candidate> | undefined

  $: {
    lq = client.query(lq, recruiting.class.Candidate, { _id: doc.item as Ref<Candidate> }, ([first]) => {
      candidate = first
    })
  }
</script>

{#if candidate}
  <div class="root">
    {candidate.name}
  </div>
{/if}

<style lang="scss">
  .root {
    display: flex;
    justify-content: center;
    align-items: center;

    height: 50px;
    font-weight: 500;

    background-color: var(--theme-button-bg-hovered);
    border: 1px solid var(--theme-bg-accent-color);
    border-radius: 12px;
  }
</style>
