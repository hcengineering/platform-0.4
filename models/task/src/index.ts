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

import { Builder, Model } from '@anticrm/model'

import core, { TDoc, TSpace, MARKDOWN_REFERENCE_PATTERN } from '@anticrm/model-core'
import { Project, CheckListItem, Task, TaskStatus } from '@anticrm/task'
import { Account, Domain, Ref, ShortRef } from '@anticrm/core'
import { Comment } from '@anticrm/chunter'
import chunter from '@anticrm/chunter'

import workbench from '@anticrm/model-workbench'

import task from './plugin'

const DOMAIN_TASK = 'task' as Domain

/**
 * @public
 */
@Model(task.class.Project, core.class.Space)
export class TProject extends TSpace implements Project {}

/**
 * @public
 */
@Model(task.class.Task, core.class.Doc, DOMAIN_TASK)
export class TTask extends TDoc implements Task {
  shortRefId!: Ref<ShortRef>
  name!: string
  description!: string
  assignee!: Ref<Account>
  status!: TaskStatus
  checkItems!: CheckListItem[]
  comments!: Array<Ref<Comment>>
}

/**
 * @public
 */
export function createModel (builder: Builder): void {
  builder.createModel(TProject, TTask)
  builder.createDoc(workbench.class.Application, {
    label: task.string.ApplicationLabelTask,
    icon: task.icon.Task,
    navigatorModel: {
      spaces: [
        {
          label: task.string.Projects,
          spaceIcon: task.icon.Task,
          spaceClass: task.class.Project,
          addSpaceLabel: task.string.CreateProject,
          createComponent: task.component.CreateProject
        }
      ],
      spaceView: task.component.TaskView,
      createComponent: task.component.CreateTask,
      editComponent: task.component.EditTask
    }
  })
  builder.createDoc(task.class.Project, {
    name: 'default',
    description: 'Default Project',
    private: false,
    members: []
  })

  // D E R I V E D   D A T A
  builder.createDoc(core.class.DerivedDataDescriptor, {
    sourceClass: task.class.Task,
    targetClass: core.class.Title,
    rules: [{ sourceField: 'name', targetField: 'title' }]
  })
  builder.createDoc(core.class.DerivedDataDescriptor, {
    sourceClass: task.class.Task,
    targetClass: core.class.Reference,
    rules: [
      {
        sourceField: 'description',
        targetField: 'link',
        pattern: {
          pattern: MARKDOWN_REFERENCE_PATTERN.source,
          multDoc: true
        }
      }
    ]
  })
  builder.createDoc(core.class.DerivedDataDescriptor, {
    sourceClass: chunter.class.Comment,
    targetClass: task.class.Task,
    collections: [
      {
        sourceField: 'replyOf',
        targetField: 'comments'
      }
    ]
  })
}
