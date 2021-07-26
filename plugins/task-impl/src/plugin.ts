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
import task, { TaskStatus } from '@anticrm/task'
import type { AnyComponent } from '@anticrm/ui'

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
  }
})
