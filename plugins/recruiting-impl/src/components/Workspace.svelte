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
  import { onDestroy } from 'svelte'
  import core, { Ref } from '@anticrm/core'
  import { CandidatePoolSpace, VacancySpace } from '@anticrm/recruiting'
  import { getClient } from '@anticrm/workbench'

  import plugin from '../plugin'

  import CandidatesWorkspace from './candidates/CandidatesWorkspace.svelte'
  import VacancyWorkspace from './vacancies/VacancyWorkspace.svelte'

  export let currentSpace: Ref<VacancySpace | CandidatePoolSpace> | undefined
  let prevSpace: Ref<VacancySpace | CandidatePoolSpace> | undefined

  let space: VacancySpace | CandidatePoolSpace | undefined

  const client = getClient()
  let unsub = () => {}

  $: if (currentSpace !== prevSpace) {
    unsub()
    unsub = () => {}
    prevSpace = currentSpace

    if (currentSpace) {
      unsub = client.query(core.class.Space, { _id: currentSpace }, (result) => {
        space = result[0]
      })
    }
  }

  onDestroy(unsub)

  const isVacancySpace = (s: VacancySpace | CandidatePoolSpace): s is VacancySpace =>
    s._class === plugin.class.VacancySpace
</script>

{#if space !== undefined}
  {#if isVacancySpace(space)}
    <VacancyWorkspace {space} />
  {:else}
    <CandidatesWorkspace {space} />
  {/if}
{/if}

<style lang="scss">
  .root {
    width: 100%;
    height: 100%;
  }
</style>