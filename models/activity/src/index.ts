//
// Copyright © 2021 Anticrm Platform Contributors.
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

import activity, { ActivityDefinition, DocumentAssociationMapper } from '@anticrm/activity'
import { Class, Doc, DOMAIN_MODEL, Ref } from '@anticrm/core'
import { Builder, Model } from '@anticrm/model'
import core, { TDoc } from '@anticrm/model-core'
import { AnyComponent, Resource } from '@anticrm/status'

/**
 * @public
 */

@Model(activity.class.ActivityDefinition, core.class.Doc, DOMAIN_MODEL)
export class TActivityDefinition extends TDoc implements ActivityDefinition {
  objectClass!: Ref<Class<Doc>>

  // Component to display an transacton.
  presenter!: AnyComponent

  associationMapper!: Resource<DocumentAssociationMapper>
}

/**
 * @public
 */
export function createModel (builder: Builder): void {
  builder.createModel(TActivityDefinition)

  builder.createDoc(
    activity.class.ActivityDefinition,
    {
      objectClass: core.class.Space,
      presenter: activity.component.SpaceActivity
    },
    activity.activity.Space
  )
}
