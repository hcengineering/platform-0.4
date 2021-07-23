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

/* eslint-disable @typescript-eslint/no-unused-vars */

import type { Attribute, Class, PropertyType, Ref, Type } from '@anticrm/core'
import type {
  Doc,
  Obj,
  Tx,
  TxCreateDoc,
  TxUpdateDoc,
  TxRemoveDoc,
  Title,
  ShortRef,
  Reference,
  DerivedData,
  DerivedDataDescriptor,
  Space,
  Account
} from '@anticrm/core'

import core from '@anticrm/core'
import { mergeIds } from '@anticrm/status'
import type { Component, Status, StatusCode } from '@anticrm/status'

/**
 * @public
 */
export default mergeIds(core, {
  class: {
    Attribute: '' as Ref<Class<Attribute<PropertyType>>>,

    TypeString: '' as Ref<Class<Type<string>>>
  }
})
