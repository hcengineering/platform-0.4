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

import { Builder, Model } from '@anticrm/model'
import type { Person } from '@anticrm/contact'
import contact from '@anticrm/contact'

import core, { TDoc } from '@anticrm/model-core'
import { Domain } from '@anticrm/core'

const DOMAIN_CONTACT = 'contact' as Domain

/**
 * @public
 */
@Model(contact.class.Person, core.class.Doc, DOMAIN_CONTACT)
export class TPerson extends TDoc implements Person {
  email!: string
  firstName!: string
  lastName!: string
  avatar!: string
  bio!: string
  phone!: string
  address!: {
    country?: string
    city?: string
    street?: string
    zip?: string
  }
}

/**
 * @public
 */
export function createModel (builder: Builder): void {
  builder.createModel(TPerson)
}
