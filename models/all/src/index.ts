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

import { Builder } from '@anticrm/model'

import { createModel as coreModel } from '@anticrm/model-core'
import { createModel as workbenchModel } from '@anticrm/model-workbench'
import { createModel as chunterModel } from '@anticrm/model-chunter'
import { createModel as fsmModel } from '@anticrm/model-fsm'
import { createModel as taskModel } from '@anticrm/model-task'
import { createModel as meetingModel } from '@anticrm/model-meeting'
import { createModel as recruitingModel } from '@anticrm/model-recruiting'

/**
 * @public
 */
const builder = new Builder()

coreModel(builder)
workbenchModel(builder)
chunterModel(builder)
fsmModel(builder)
recruitingModel(builder)
taskModel(builder)
meetingModel(builder)

/**
 * @public
 */
export default builder
