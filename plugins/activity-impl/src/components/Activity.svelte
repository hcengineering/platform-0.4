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
  import type { ActivityDefinition } from '@anticrm/activity'
  import activity from '@anticrm/activity'

  import type { Class, Doc, DocumentQuery, Ref, Space, Tx } from '@anticrm/core'
  import core, { SortingOrder } from '@anticrm/core'
  import { getResource } from '@anticrm/platform'
  import type { QueryUpdater } from '@anticrm/presentation'
  import type { AnyComponent } from '@anticrm/status'
  import { Label } from '@anticrm/ui'
  import { getClient } from '@anticrm/workbench'
  import TxView from './TxView.svelte'

  export let spaceId: Ref<Space>
  export let doc: Doc | undefined = undefined

  let limit = 3
  const endLimit = 3
  const step = 5

  const client = getClient()

  let definitions: ActivityDefinition[] = []
  let adq: QueryUpdater<ActivityDefinition> | undefined
  let activityClasses: Ref<Class<Doc>>[] = []
  let presenters = new Map<Ref<Class<Doc>>, AnyComponent>()

  const updateActivityDefinitions = async (
    defs: ActivityDefinition[]
  ): Promise<{ activityClasses: Ref<Class<Doc>>[]; presenters: Map<Ref<Class<Doc>>, AnyComponent> }> => {
    const activityClasses: Ref<Class<Doc>>[] = []
    const newPresenters = new Map<Ref<Class<Doc>>, AnyComponent>()
    for (const d of defs) {
      newPresenters.set(d.objectClass, d.presenter)
    }
    for (const d of defs) {
      const ds = await client.getDescendants(d.objectClass)
      activityClasses.push(...ds)
      for (const dd of ds) {
        if (!presenters.has(dd)) {
          presenters.set(dd, d.presenter)
        }
      }
    }
    return { activityClasses, presenters }
  }

  $: adq = client.query(adq, activity.class.ActivityDefinition, {}, (defs) => {
    definitions = defs
    updateActivityDefinitions(definitions).then((res) => {
      activityClasses = res.activityClasses
      presenters = res.presenters
    })
  })

  let docQuery: DocumentQuery<Tx<Doc>> = {}
  let docTailQuery: DocumentQuery<Tx<Doc>> = {}

  const updateQuery = async (
    spaceId: Ref<Space>,
    doc: Doc | undefined,
    definitions: ActivityDefinition[],
    activityClasses: Ref<Class<Doc>>[]
  ): Promise<void> => {
    if (doc === undefined) {
      docQuery = {
        $or: [
          {
            objectSpace: spaceId,
            $or: [{ operations: { $exists: true } }, { attributes: { $exists: true } }]
          },
          { objectId: spaceId }
        ],
        objectClass: { $in: activityClasses }
      }
    } else {
      const ors: DocumentQuery<Tx<Doc>>[] = [
        {
          objectId: doc._id,
          objectClass: doc._class,
          $or: [{ operations: { $exists: true } }, { attributes: { $exists: true } }]
        }
      ]
      for (const d of definitions) {
        if (d.associationMapper !== undefined) {
          if (await client.isDerived(doc._class, d.objectClass)) {
            const mapper = await getResource(d.associationMapper)
            const extraQuery = mapper?.(doc) ?? []
            // Put extra queries per individual class we could show activity for.
            ors.push(...extraQuery)
          }
        }
      }
      docQuery = { objectSpace: spaceId, $or: ors }
    }
  }
  $: updateQuery(spaceId, doc, definitions, activityClasses)

  let txes: Tx[] = []
  let txesTail: Tx[] = []
  let tailRequired = false
  let leftTxes: number = 0
  let tailSID = -1
  let txesTotal = 0

  let tq: QueryUpdater<Tx<Doc>> | undefined
  $: tq = client.query(
    tq,
    core.class.Tx,
    docQuery,
    (result) => {
      txes = result
      tailSID = Math.max(...txes.map((t) => t.sid))
      tailRequired = result.total > result.length
      txesTotal = result.total

      leftTxes = result.total - limit - endLimit

      docTailQuery = { ...docQuery, sid: { $gt: tailSID } }
    },
    { limit }
  )

  let tailQ: QueryUpdater<Tx<Doc>> | undefined
  $: if (tailRequired) {
    tailQ = client.query(
      tailQ,
      core.class.Tx,
      docTailQuery,
      (result) => {
        txesTail = result.reverse()
      },
      { limit: endLimit, sort: { sid: SortingOrder.Descending } }
    )
  }
</script>

<div class="activity-root">
  {#each txes as tx}
    <TxView {tx} {doc} {presenters} />
  {/each}

  {#if leftTxes > 0}
    <div
      class="link-text"
      on:click={() => {
        limit += step
      }}
    >
      <Label label={activity.string.LoadMore} params={{ step: Math.min(leftTxes, step), total: leftTxes }} />
    </div>
  {/if}

  {#each txesTail as tx}
    <TxView {tx} {doc} {presenters} />
  {/each}
</div>

<style lang="scss">
  .activity-root {
    margin: 30px;
    display: flex;
    flex-direction: column;
    row-gap: 20px;
  }
</style>
