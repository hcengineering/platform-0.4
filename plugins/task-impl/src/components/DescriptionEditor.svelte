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
  import type { Account, Ref, Space, Title } from '@anticrm/core'
  import type { IntlString } from '@anticrm/status'
  import { getClient } from '@anticrm/workbench'
  import { MDRefEditor } from '@anticrm/ui'
  import type { CompletionItem, ItemRefefence, ExtendedCompletionItem } from '@anticrm/ui'

  export let lines = 3
  export let value: string = ''
  export let label: IntlString | undefined
  export let placeholder: IntlString | undefined
  export let currentSpace: Ref<Space>

  let completions: CompletionItem[] = []

  const client = getClient()

  async function getTitles (prefix: string) {
    const titles = await client.findAll(core.class.Title, { title: { $like: prefix + '%' } }, { limit: 50 })
    completions = updateTitles(titles)
  }

  async function getAccounts (prefix: string) {
    const docs = await client.findAll(core.class.Account, { name: { $like: '%' + prefix + '%' } }, { limit: 50 })
    completions = updateAccounts(docs)
  }

  function updateTitles (docs: Title[]): CompletionItem[] {
    const items: CompletionItem[] = []
    for (const value of docs) {
      const kk = value.title
      items.push({
        key: `${value._id}${value.title}`,
        completion: value.objectId,
        label: kk,
        title: `${kk} - ${value.objectClass}`,
        class: value.objectClass,
        id: value.objectId
      } as ExtendedCompletionItem)
    }
    return items
  }

  function updateAccounts (docs: Account[]): CompletionItem[] {
    const items: CompletionItem[] = []
    for (const value of docs) {
      const { label, fln } = getLabel(value)
      items.push({
        key: value._id,
        completion: value._id,
        label,
        title: fln.length > 0 ? fln + `(${value.name})` : value.name,
        class: core.class.Account,
        id: `${currentSpace}-${value._id}`
      } as ExtendedCompletionItem)
    }
    return items
  }

  function getLabel (value: Account): { label: string; fln: string } {
    const fln = ((value.firstName ?? '') + ' ' + (value.lastName ?? '')).trim()
    return { label: '@' + (fln.length > 0 ? fln : value.name) + ' ', fln }
  }

  async function getCompletions (currentPrefix: string): Promise<void> {
    if (currentPrefix.length === 0) return
    if (currentPrefix.startsWith('[[')) {
      await getTitles(currentPrefix.substring(2))
    } else if (currentPrefix.startsWith('@')) {
      await getAccounts(currentPrefix.substring(1))
    }
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
  on:prefix={async (event) => {
    await getCompletions(event.detail)
  }}
/>
