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

import { Account, Ref, Space, VDoc } from '@anticrm/core'
import { Model } from '@anticrm/model'
import core from './component'
import { TDoc } from './core'

// V D O C --- T R A N S A C T I O N S
@Model(core.class.VDoc, core.class.Doc)
export class TVDoc extends TDoc implements VDoc {
  space!: Ref<Space>
  createdOn!: number
  createdBy!: Ref<Account>
  modifiedOn!: number
  modifiedBy!: Ref<Account>
}
