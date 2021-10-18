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

import chunter, { CommentRef } from '@anticrm/chunter'
import { Account, DocumentPresenter, Domain, PresentationMode, Ref, ShortRef } from '@anticrm/core'
import { Builder, Model } from '@anticrm/model'
import core, { MARKDOWN_MENTION_PATTERN, MARKDOWN_REFERENCE_PATTERN, TDoc, TSpace } from '@anticrm/model-core'
import notification from '@anticrm/notification'

import workbench from '@anticrm/model-workbench'
import { CheckListItem, Project, Task, TaskStatus } from '@anticrm/task'
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
  dueTo!: Date
  checkItems!: CheckListItem[]
  comments!: CommentRef[]
}

/**
 * @public
 */
export function createModel (builder: Builder): void {
  builder.createModel(TProject, TTask)
  builder.createDoc(
    workbench.class.Application,
    {
      label: task.string.ApplicationLabelTask,
      icon: task.icon.Task,
      navigatorModel: {
        specials: [
          {
            id: 'my-tasks',
            label: task.string.MyTasks,
            component: task.component.MyTasksView,
            icon: task.icon.Task
          },
          {
            id: 'favourite',
            label: task.string.Favorite,
            component: task.component.FavoriteView,
            icon: task.icon.Star
          }
        ],
        spaces: [
          {
            label: task.string.Projects,
            spaceIcon: task.icon.Task,
            spaceClass: task.class.Project,
            addSpaceLabel: task.string.CreateProject,
            createComponent: task.component.CreateProject,
            item: {
              createComponent: task.component.CreateTask,
              editComponent: task.component.EditTask
            }
          }
        ],
        spaceView: task.component.ProjectView
      }
    },
    task.ids.Application
  )

  builder.createDoc(
    task.class.Project,
    {
      name: 'default',
      description: 'Default Project',
      private: false,
      members: []
    },
    task.space.Default
  )

  // D E R I V E D   D A T A
  builder.createDoc(
    core.class.DerivedDataDescriptor,
    {
      sourceClass: task.class.Task,
      targetClass: core.class.Title,
      rules: [{ sourceField: 'name', targetField: 'title' }]
    },
    task.dd.NameTitleIndex
  )
  builder.createDoc(
    core.class.DerivedDataDescriptor,
    {
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
    },
    task.dd.ReferencesIndex
  )
  builder.createDoc(
    core.class.DerivedDataDescriptor,
    {
      sourceClass: chunter.class.Comment,
      targetClass: task.class.Task,
      query: {
        replyOf: { $like: '%class:task.Task%' }
      },
      collections: [
        {
          sourceField: 'replyOf',
          targetField: 'comments'
        },
        {
          sourceField: 'modifiedOn',
          targetField: 'lastModified'
        }
      ]
    },
    task.dd.ReplyOf
  )

  builder.createDoc(
    core.class.DerivedDataDescriptor,
    {
      sourceClass: task.class.Task,
      targetClass: notification.class.SpaceLastViews,
      collections: [
        {
          sourceField: 'description',
          targetField: 'notificatedObjects',
          sourceFieldPattern: {
            pattern: MARKDOWN_MENTION_PATTERN.source,
            multDoc: true,
            group: 1
          }
        }
      ]
    },
    task.dd.TaskNotifications
  )

  // P R E S E N T E R S
  builder.createDoc<DocumentPresenter<Task>>(
    core.class.DocumentPresenter,
    {
      objectClass: task.class.Task,
      presentation: [
        {
          component: task.component.TaskRefView,
          description: 'Task Ref',
          mode: PresentationMode.Link
        },
        {
          component: task.component.TaskPreview,
          description: 'Task Preview',
          mode: PresentationMode.Preview
        },
        {
          component: task.component.EditTask,
          description: 'Task editor',
          mode: PresentationMode.Edit
        }
      ]
    },
    task.presenter.TaskPresenter
  )
}
