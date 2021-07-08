//
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
//

import { mergeIds } from '@anticrm/status'
import type { IntlString } from '@anticrm/status'
import type { AnyComponent } from '@anticrm/ui'
import type { Ref, Class, Doc, Account } from '@anticrm/core'
import type { Project } from '@anticrm/task'

import task from '@anticrm/task'

export enum TaskStatus {
  Open,
  InProgress,
  Resolved,
  Closed
}

export interface Task extends Doc {
  name: string,
  description: string,
  assignee?: Ref<Account>,
  status: TaskStatus,
}

export default mergeIds(task, {
  component: {
    CreateProject: '' as AnyComponent,
    TaskView: '' as AnyComponent,
    CreateTask: '' as AnyComponent
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
    CreateTask: '' as IntlString
  }
})
