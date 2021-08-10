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
  import core from '@anticrm/core'
  import type { DocumentQuery, Title } from '@anticrm/core'
  import type { IntlString } from '@anticrm/status'
  import { getClient } from '@anticrm/workbench'
  import { MDRefEditor } from '@anticrm/ui'
  import type { CompletionItem, ItemRefefence, ExtendedCompletionItem } from '@anticrm/ui'
  import type { QueryUpdater } from '@anticrm/presentation'

  export let lines = 10
  export let value: string = ''
  export let label: IntlString | undefined
  export let placeholder: IntlString | undefined

  let currentPrefix = ''

  let completions: CompletionItem[] = []

  const client = getClient()

  function query (prefix: string): DocumentQuery<Title> {
    return {
      title: { $like: prefix + '%' }
    }
  }

  let lq: QueryUpdater<Title> | undefined

  $: if (currentPrefix !== '') {
    lq = client.query(
      lq,
      core.class.Title,
      query(currentPrefix),
      (docs) => {
        completions = updateTitles(docs)
      },
      { limit: 50 }
    )
  }

  function updateTitles (docs: Title[]): CompletionItem[] {
    const items: CompletionItem[] = []
    for (const value of docs) {
      // if (startsWith(value.title.toString(), currentPrefix)) {
      const kk = value.title
      items.push({
        key: `${value.objectId}${value.title}`,
        completion: value.objectId,
        label: kk,
        title: `${kk} - ${value.objectClass}`,
        class: value.objectClass,
        id: value.objectId
      } as ExtendedCompletionItem)
      // }
    }
    return items
  }

  async function findTitle (title: string): Promise<ItemRefefence[]> {
    const docs = await client.findAll<Title>(core.class.Title, {
      title: title
    })

    for (const value of docs) {
      if (value.title === title) {
        return [
          {
            id: value.objectId,
            class: value.objectClass
          } as ItemRefefence
        ]
      }
    }
    return []
  }
</script>

<MDRefEditor
  bind:value
  {label}
  {placeholder}
  {lines}
  findFunction={findTitle}
  {completions}
  on:blur
  on:prefix={(event) => {
    currentPrefix = event.detail
  }}
/>
