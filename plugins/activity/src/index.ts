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

import { Class, Doc, DocumentQuery, Ref, Tx } from '@anticrm/core'
import type { Plugin, Service } from '@anticrm/platform'
import { plugin } from '@anticrm/platform'
import type { AnyComponent, Asset, IntlString, Resource } from '@anticrm/status'

export interface ActivityService extends Service {}

const PluginActivity = 'activity' as Plugin<ActivityService>

/**
 * Provide associations for given document.
 * @public
 */
export type DocumentAssociationMapper = (doc: Doc) => Array<DocumentQuery<Tx<Doc>>>

/**
 * @public
 */
export interface ActivityDefinition extends Doc {
  // tx.objectClass match.
  objectClass: Ref<Class<Doc>>

  // Component to display an transacton.
  presenter: AnyComponent

  associationMapper?: Resource<DocumentAssociationMapper>
}

export default plugin(PluginActivity, {}, {
  icon: {
    Activity: '' as Asset
  },
  class: {
    ActivityDefinition: '' as Ref<Class<ActivityDefinition>>
  },
  component: {
    Activity: '' as AnyComponent,
    SpaceActivity: '' as AnyComponent
  },
  string: {
    Activity: '' as IntlString,
    LoadMore: '' as IntlString
  },
  activity: {
    Space: '' as Ref<ActivityDefinition>
  }
})
