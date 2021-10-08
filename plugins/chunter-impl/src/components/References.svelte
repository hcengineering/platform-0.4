<!--
// Copyright © 2020 Anticrm Platform Contributors.
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
  import core, { Doc, Reference, SortingOrder } from '@anticrm/core'
  import type { QueryUpdater } from '@anticrm/presentation'
  import type { IntlString, UIComponent } from '@anticrm/status'
  import { Section } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import { afterUpdate, createEventDispatcher } from 'svelte'
  import { ReferenceKind } from '../messages'
  import type { DocumentReference } from '../messages'
  import RefControl from './RefControl.svelte'

  export let icon: UIComponent
  export let label: IntlString
  export let closed: boolean = false

  export let docRef: Doc

  const client = getClient()
  let query: QueryUpdater<Reference> | undefined

  const dispatch = createEventDispatcher()
  afterUpdate(async () => {
    dispatch('update')
  })

  let references: Reference[] = []
  let queryString: string = '#'

  $: {
    queryString = `%ref://${docRef._class.replace('class:', '')}#${docRef._id}%`
  }
  $: {
    query = client.query<Reference>(
      query,
      core.class.Reference,
      { link: { $like: queryString } },
      (result) => {
        references = result
      },
      {
        sort: { createOn: SortingOrder.Ascending }
      }
    )
  }
  function toRef (r: Reference): DocumentReference {
    return { objectClass: r.objectClass, objectId: r.objectId, kind: ReferenceKind.Document, text: '' }
  }
</script>

{#if references.length > 0}
  <Section {label} {icon} {closed}>
    <div class="channel-container">
      {#each references as r (r._id)}
        <RefControl reference={toRef(r)} componentOnly={true} />
      {/each}
    </div>
  </Section>
{/if}

<style lang="scss">
  .channel-container {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
  }
</style>
