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

import { DocumentAssociationMapper } from '@anticrm/activity'
import { DocumentLinkHandler } from '@anticrm/core'
import type { AnyComponent } from '@anticrm/status'
import { IntlString, mergeIds, Resource } from '@anticrm/status'
import task, { TaskStatus } from '@anticrm/task'

export function getStatusColor (status: TaskStatus): string {
  switch (status) {
    case task.string.Open:
      return '#9D92C4'
    case task.string.InProgress:
      return '#61A6AF'
    case task.string.Closed:
      return '#73A6CD'
    default:
      return '#F28469'
  }
}

export default mergeIds(task, {
  component: {
    CreateProject: '' as AnyComponent,
    ProjectView: '' as AnyComponent,
    MyTasksView: '' as AnyComponent,
    FavoriteView: '' as AnyComponent,
    CreateTask: '' as AnyComponent,
    EditTask: '' as AnyComponent,

    TaskPreview: '' as AnyComponent,
    TaskRefView: '' as AnyComponent,
    ProjectProperties: '' as AnyComponent,
    TaskActivity: '' as AnyComponent
  },
  string: {
    PleaseSelectSpace: '' as IntlString
  },
  activity: {
    Mapper: '' as Resource<DocumentAssociationMapper>
  },
  handler: {
    OpenHandler: '' as DocumentLinkHandler
  }
})
