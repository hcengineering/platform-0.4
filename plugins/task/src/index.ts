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

import type { Comment } from '@anticrm/chunter'
import type { Account, Class, Doc, Ref, ShortRef, Space } from '@anticrm/core'
import type { Plugin, Service } from '@anticrm/platform'
import { plugin } from '@anticrm/platform'
import type { Asset, IntlString } from '@anticrm/status'

export interface Project extends Space {}

export interface TaskService extends Service {}

export interface Task extends Doc {
  shortRefId: Ref<ShortRef>
  name: string
  description: string
  assignee?: Ref<Account>
  status: TaskStatus
  checkItems: CheckListItem[]
  dueTo: Date
  comments: Array<Ref<Comment>>
}

export interface CheckListItem {
  description: string
  done: boolean
}

const PluginTask = 'task' as Plugin<TaskService>

const task = plugin(
  PluginTask,
  {},
  {
    icon: {
      Task: '' as Asset,
      Star: '' as Asset
    },
    class: {
      Project: '' as Ref<Class<Project>>,
      Task: '' as Ref<Class<Task>>
    },
    string: {
      Projects: '' as IntlString,
      ProjectName: '' as IntlString,
      ProjectDescription: '' as IntlString,
      MakePrivate: '' as IntlString,
      MakePrivateDescription: '' as IntlString,
      TaskName: '' as IntlString,
      TaskDescription: '' as IntlString,
      CreateTask: '' as IntlString,
      Assignee: '' as IntlString,
      AssignTask: '' as IntlString,
      ApplicationLabelTask: '' as IntlString,
      CreateProject: '' as IntlString,
      Progress: '' as IntlString,
      AddCheckItem: '' as IntlString,
      CheckItems: '' as IntlString,
      ProjectMembers: '' as IntlString,
      GeneralInformation: '' as IntlString,
      IviteMember: '' as IntlString,
      General: '' as IntlString,
      Attachment: '' as IntlString,
      ToDos: '' as IntlString,
      Due: '' as IntlString,
      PickDue: '' as IntlString,
      Comments: '' as IntlString,
      Status: '' as IntlString,
      Open: '' as IntlString,
      InProgress: '' as IntlString,
      Closed: '' as IntlString,
      Favorite: '' as IntlString,
      MyTasks: '' as IntlString
    }
  }
)

export const TaskStatuses = {
  Open: task.string.Open,
  InProgress: task.string.InProgress,
  Closed: task.string.Closed
} as const

export type TaskStatus = typeof TaskStatuses[keyof typeof TaskStatuses]

export default task
