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

import type { Account, Class, ClassifierKind, Doc, Domain, Mixin, Obj, Ref, Space, Timestamp } from '@anticrm/core'
import { DOMAIN_MODEL } from '@anticrm/core'
import { Model } from '@anticrm/model'
import core from './component'

// C O R E

/**
 * @public
 */
@Model(core.class.Obj, core.class.Obj)
export class TObj implements Obj {
  _class!: Ref<Class<this>>
}

/**
 * @public
 */
@Model(core.class.Doc, core.class.Obj)
export class TDoc extends TObj implements Doc {
  _id!: Ref<this>
  space!: Ref<Space>
  modifiedOn!: Timestamp
  modifiedBy!: Ref<Account>
  createOn!: Timestamp
}

/**
 * @public
 */
@Model(core.class.Class, core.class.Doc, DOMAIN_MODEL)
export class TClass extends TDoc implements Class<Obj> {
  kind!: ClassifierKind
  extends!: Ref<Class<Obj>>
  domain!: Domain
}

/**
 * @public
 */
@Model(core.class.Mixin, core.class.Class)
export class TMixin extends TClass implements Mixin<Doc> {}
