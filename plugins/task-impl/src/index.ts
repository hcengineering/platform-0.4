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

import type { TaskService } from '@anticrm/task'
import { setResource } from '@anticrm/platform'
import task from './plugin'

import CreateTask from './components/CreateTask.svelte'
import EditTask from './components/EditTask.svelte'
import ProjectView from './components/ProjectView.svelte'
import MyTasksView from './components/MyTasksView.svelte'
import FavoriteView from './components/FavoriteView.svelte'
import CreateProject from './components/CreateProject.svelte'

export default async (): Promise<TaskService> => {
  setResource(task.component.CreateProject, CreateProject)
  setResource(task.component.ProjectView, ProjectView)
  setResource(task.component.MyTasksView, MyTasksView)
  setResource(task.component.FavoriteView, FavoriteView)
  setResource(task.component.CreateTask, CreateTask)
  setResource(task.component.EditTask, EditTask)

  return {}
}
