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

import type {
  BackReference,
  Class,
  Data,
  DerivedData,
  DerivedDataDescriptor,
  Doc,
  DocumentMapper,
  Domain,
  MappingRule,
  Ref,
  Reference,
  Title
} from '@anticrm/core'
import { DOMAIN_MODEL } from '@anticrm/core'
import { Model } from '@anticrm/model'
import { Resource } from '@anticrm/status'
import core from './component'
import { TDoc } from './core'

// D E R I V E D  D A T A

const DOMAIN_TITLE = 'title' as Domain
const DOMAIN_REFERENCE = 'references' as Domain

@Model(core.class.DerivedData, core.class.Doc, DOMAIN_MODEL)
export class TDerivedData extends TDoc implements DerivedData {
  descriptorId!: Ref<DerivedDataDescriptor<Doc, DerivedData>>
  objectId!: Ref<Doc>
  objectClass!: Ref<Class<Doc>>
}

@Model(core.class.DerivedDataDescriptor, core.class.Doc, DOMAIN_MODEL)
export class TDerivedDataDescriptor<T extends Doc = Doc, D extends DerivedData = DerivedData>
  extends TDoc
  implements DerivedDataDescriptor<T, D> {
  sourceClass!: Ref<Class<T>>
  targetClass!: Ref<Class<D>>
  initiValue!: Data<D>
  mapping!: MappingRule[] | Resource<DocumentMapper>
  multiRule?: MappingRule
}

@Model(core.class.Title, core.class.DerivedData, DOMAIN_TITLE)
export class TTitle extends TDerivedData implements Title {
  title!: string
}

@Model(core.class.Reference, core.class.DerivedData, DOMAIN_REFERENCE)
export class TReference extends TDerivedData implements Reference {}

@Model(core.class.BackReference, core.class.Reference, DOMAIN_REFERENCE)
export class TBackReference extends TDerivedData implements BackReference {
  sourceObjectId!: Ref<Doc>
  sourceObjectClass!: Ref<Class<Doc>>
}
