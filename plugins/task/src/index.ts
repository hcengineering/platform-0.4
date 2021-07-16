//
// Copyright © 2020, 2021 Anticrm Platform Contributors.
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
//

import { plugin } from '@anticrm/platform'
import type { Asset, IntlString } from '@anticrm/status'
import type { Plugin, Service } from '@anticrm/platform'
import type { Account, Doc, Ref, ShortRef, Space } from '@anticrm/core'

export interface Project extends Space {}

export interface TaskService extends Service {}

export const TaskStatuses = {
  Open: 'Open' as IntlString,
  InProgress: 'InProgress' as IntlString,
  Closed: 'Closed' as IntlString
} as const

export type TaskStatus = typeof TaskStatuses[keyof typeof TaskStatuses]

export interface Task extends Doc {
  shortRefId: Ref<ShortRef>
  name: string
  description: string
  assignee?: Ref<Account>
  status: TaskStatus
  checkItems: CheckListItem[]
  commentSpace: Ref<Space>
}

export interface CheckListItem {
  description: string
  done: boolean
}

const PluginTask = 'task' as Plugin<TaskService>

export default plugin(
  PluginTask,
  {},
  {
    icon: {
      Task: '' as Asset
    }
  }
)
