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
import type { Component, StatusCode } from '@anticrm/status'
import { component } from '@anticrm/status'
import type { Account, Attribute, Class, Doc, Obj, PropertyType, Ref, Space } from './classes'
import { DerivedData, DerivedDataDescriptor, DerivedDataDescriptorState } from './derived'
import { DocumentPresenter } from './presentation'
import { Reference } from './reference'
import { ShortRef } from './shortref'
import { Title } from './title'
import type { Tx, TxCreateDoc, TxRemoveDoc, TxUpdateDoc } from './tx'

const ComponentCore = 'core' as Component

/**
 * @public
 */
export default component(ComponentCore, {
  class: {
    Obj: '' as Ref<Class<Obj>>,
    Doc: '' as Ref<Class<Doc>>,
    Class: '' as Ref<Class<Class<Obj>>>,
    Attribute: '' as Ref<Class<Attribute<PropertyType>>>,
    Tx: '' as Ref<Class<Tx>>,
    TxCreateDoc: '' as Ref<Class<TxCreateDoc<Doc>>>,
    TxUpdateDoc: '' as Ref<Class<TxUpdateDoc<Doc>>>,
    TxRemoveDoc: '' as Ref<Class<TxRemoveDoc<Doc>>>,
    Space: '' as Ref<Class<Space>>,
    Account: '' as Ref<Class<Account>>,
    ShortRef: '' as Ref<Class<ShortRef>>,

    DerivedData: '' as Ref<Class<DerivedData>>,
    DerivedDataDescriptor: '' as Ref<Class<DerivedDataDescriptor<Doc, DerivedData>>>,
    DerivedDataDescriptorState: '' as Ref<Class<DerivedDataDescriptorState>>,
    Title: '' as Ref<Class<Title>>,
    Reference: '' as Ref<Class<Reference>>,

    DocumentPresenter: '' as Ref<Class<DocumentPresenter<Doc>>>
  },
  space: {
    Tx: '' as Ref<Space>, // A special space for all transactions
    Model: '' as Ref<Space>, // A special space for all model transactions.
    DerivedData: '' as Ref<Space> // A special space for derived data states.
  },
  account: {
    System: '' as Ref<Account>
  },
  status: {
    ObjectNotFound: '' as StatusCode<{ _id: Ref<Doc> }>,
    ObjectAlreadyExists: '' as StatusCode<{ _id: Ref<Doc> }>,
    ItemNotFound: '' as StatusCode<{ _id: Ref<Doc>, _localId: string }>
  },
  dd: {
    Global: '' as Ref<DerivedDataDescriptor<Doc, Doc>>
  }
})
