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

import type { Tx } from '@anticrm/core'
import { Builder } from '@anticrm/model'

import { createModel as coreModel } from '@anticrm/model-core'
import { createModel as workbenchModel } from '@anticrm/model-workbench'
import { createModel as chunterModel } from '@anticrm/model-chunter'

const builder = new Builder()

coreModel(builder)
workbenchModel(builder)
chunterModel(builder)

console.log(JSON.stringify(builder.getTxes()))

