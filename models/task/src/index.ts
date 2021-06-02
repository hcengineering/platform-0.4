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

import { TSpace } from '@anticrm/model-core'
import type { Project } from '@anticrm/task'

import workbench from '@anticrm/model-workbench'
import core from '@anticrm/model-core'
import task from './plugin'

@Model(task.class.Project, core.class.Space)
export class TProject extends TSpace implements Project {}

export function createModel(builder: Builder) {
  builder.createModel(TProject)
  builder.createDoc(workbench.class.Application, {
    label: task.string.ApplicationLabelTask,
    icon: task.icon.Task,
    navigator: task.component.Navigator
  })
  builder.createDoc(task.class.Project, {
    name: 'default',
    description: 'Default Project',
    private: false
  })
}