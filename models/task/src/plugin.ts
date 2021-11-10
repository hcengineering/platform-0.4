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

import { ActivityDefinition, DocumentAssociationMapper } from '@anticrm/activity'
import { DerivedDataDescriptor, Doc, DocumentPresenter, Ref, DocumentLinkHandler } from '@anticrm/core'
import {} from '@anticrm/platform'
import { AnyComponent, mergeIds, Resource } from '@anticrm/status'
import task, { Project, Task } from '@anticrm/task'
import { Application } from '@anticrm/workbench'

export default mergeIds(task, {
  component: {
    CreateProject: '' as AnyComponent,
    ProjectView: '' as AnyComponent,
    MyTasksView: '' as AnyComponent,
    FavoriteView: '' as AnyComponent,
    CreateTask: '' as AnyComponent,
    EditTask: '' as AnyComponent,

    // An preview to be inside channel
    TaskPreview: '' as AnyComponent,

    // An one line reference to be shown during editing, should allow to select different task
    TaskRefView: '' as AnyComponent,

    ProjectProperties: '' as AnyComponent,
    TaskActivity: '' as AnyComponent
  },
  ids: {
    Application: '' as Ref<Application>
  },
  space: {
    Default: '' as Ref<Project>
  },
  dd: {
    NameTitleIndex: '' as Ref<DerivedDataDescriptor<Doc, Doc>>,
    ReferencesIndex: '' as Ref<DerivedDataDescriptor<Doc, Doc>>,
    ReplyOf: '' as Ref<DerivedDataDescriptor<Doc, Doc>>,
    TaskNotifications: '' as Ref<DerivedDataDescriptor<Doc, Doc>>
  },
  presenter: {
    TaskPresenter: '' as Ref<DocumentPresenter<Task>>
  },
  activity: {
    Activity: '' as Ref<ActivityDefinition>,
    Mapper: '' as Resource<DocumentAssociationMapper>
  },
  handler: {
    OpenHandler: '' as DocumentLinkHandler
  }
})
