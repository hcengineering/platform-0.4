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

import { plugin } from '@anticrm/platform'
import type { Plugin, Service } from '@anticrm/platform'
import type { Doc, Ref, Class } from '@anticrm/core'

/**
 * @public
 */
export interface Person extends Doc {
  email: string
  firstName: string
  lastName: string
  avatar?: string
  bio?: string
  address: {
    country?: string
    city?: string
  }
}

export interface ContactService extends Service {}

const PluginContact = 'contact' as Plugin<ContactService>

export default plugin(PluginContact, {}, {
  class: {
    Person: '' as Ref<Class<Person>>
  }
})
