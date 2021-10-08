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
  import { deepEqual } from 'fast-equals'
  import cloneDeep from 'lodash.clonedeep'

  import core from '@anticrm/core'
  import type { VacancySpace } from '@anticrm/recruiting'
  import recruiting from '@anticrm/recruiting'
  import { ScrollBox } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'

  import VacancyEditor from './VacancyEditor.svelte'

  export let space: VacancySpace
  let prevSpace: VacancySpace = space
  let localSpace: VacancySpace = cloneDeep(space)

  $: if (space !== prevSpace) {
    localSpace = cloneDeep(space)
    prevSpace = space
  }

  const client = getClient()

  async function onUpdate () {
    if (space === undefined || localSpace === undefined) {
      return
    }

    const a: any = space
    const b: any = localSpace
    const update = Object.keys(space).reduce(
      (res, key) => (deepEqual(a[key], b[key]) ? res : { ...res, [key]: b[key] }),
      {}
    )

    if (Object.getOwnPropertyNames(update).length === 0) {
      return
    }

    await client.updateDoc(recruiting.class.VacancySpace, core.space.Model, space._id, update)
  }
</script>

{#if localSpace !== undefined}
  <div class="root">
    <ScrollBox vertical>
      <VacancyEditor bind:vacancy={localSpace} on:update={onUpdate} />
    </ScrollBox>
  </div>
{/if}

<style lang="scss">
  .root {
    padding: 0 40px;
    width: 100%;
    height: 100%;
  }
</style>
