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

import task, { Project, Task, TaskStatus } from '@anticrm/task'
import { mergeIds, IntlString } from '@anticrm/status'
import type { AnyComponent } from '@anticrm/ui'
import type { Ref, Class } from '@anticrm/core'

export function getStatusColor (status: TaskStatus): string {
  switch (status) {
    case 'OPEN':
      return '#9D92C4'
    case 'IN PROGRESS':
      return '#61A6AF'
    case 'CLOSED':
      return '#73A6CD'
    default:
      return '#F28469'
  }
}

export default mergeIds(task, {
  component: {
    CreateProject: '' as AnyComponent,
    TaskView: '' as AnyComponent,
    CreateTask: '' as AnyComponent,
    EditTask: '' as AnyComponent
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
    CheckItems: '' as IntlString
  }
})
