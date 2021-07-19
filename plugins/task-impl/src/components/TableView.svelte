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
  import { Table, Label, UserInfo } from '@anticrm/ui'
  import type { Ref, Class, Doc, Space} from '@anticrm/core'
  import type { IntlString } from '@anticrm/status'
  import { getClient } from '@anticrm/workbench'

  import TaskStatus from './TaskStatus.svelte';

  import task from '../plugin'

  export let currentSpace: Ref<Space> | undefined
  let prevSpace: Ref<Space> | undefined

  const _class: Ref<Class<Doc>> = task.class.Task
  const columns = [
    {label: 'Name' as IntlString, properties: [{key: 'name', property: 'label'}], component: Label},
    {label: 'Description' as IntlString, properties: [{key: 'description', property: 'label'}], component: Label},
    {label: 'Status' as IntlString, properties: [{key: 'status', property: 'title'}, {value: '#73A5C9', property: 'color'}], component: TaskStatus},
    {label: 'Assignee' as IntlString, properties: [{value:'elon', property: 'user'}], component: UserInfo}
  ]

  const client = getClient()
  let data: Doc[] = []
  let unsub = () => {}
  $: if (currentSpace != prevSpace) {
    unsub()
    unsub = () => {}
    prevSpace = currentSpace

    if (currentSpace !== undefined) {
      unsub = client.query(_class, { space: currentSpace }, (result) => data = result)
    }
  }

  onDestroy(unsub)
</script>

<Table {data} {columns}/>
