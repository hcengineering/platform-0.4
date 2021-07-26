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

import {
  Class,
  Data,
  DerivedData,
  DerivedDataDescriptor,
  Doc,
  DocumentMapper,
  Domain,
  DOMAIN_MODEL,
  DOMAIN_REFERENCES,
  MappingRule,
  Ref,
  Reference,
  ShortRef,
  Title
} from '@anticrm/core'
import { Model } from '@anticrm/model'
import { Resource } from '@anticrm/status'
import core from './component'
import { TDoc } from './core'

// D E R I V E D  D A T A

const DOMAIN_TITLE = 'title' as Domain

/**
 * @public
 */
@Model(core.class.DerivedData, core.class.Doc, DOMAIN_MODEL)
export class TDerivedData extends TDoc implements DerivedData {
  descriptorId!: Ref<DerivedDataDescriptor<Doc, DerivedData>>
  objectId!: Ref<Doc>
  objectClass!: Ref<Class<Doc>>
}

/**
 * @public
 */
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

/**
 * @public
 */
@Model(core.class.Title, core.class.DerivedData, DOMAIN_TITLE)
export class TTitle extends TDerivedData implements Title {
  title!: string
}

/**
 * @public
 */
export const MARKDOWN_REFERENCE_PATTERN = /\[([a-zA-Z-\d]+)\]\(ref:\/\/([a-zA-Z.]+)#([a-zA-Z\d]+)\)/g

/**
 * @public
 */
@Model(core.class.Reference, core.class.DerivedData, DOMAIN_REFERENCES)
export class TReference extends TDerivedData implements Reference {
  link!: string
}

/**
 * @public
 */
@Model(core.class.ShortRef, core.class.Title, DOMAIN_TITLE)
export class TShortRef extends TTitle implements ShortRef {
  namespace!: string
  counter!: number
}
