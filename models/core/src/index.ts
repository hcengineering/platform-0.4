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

import { Builder } from '@anticrm/model'
import core from './component'
import { TClass, TDoc, TMixin, TObj } from './core'
import { TDerivedData, TDerivedDataDescriptor, TReference, TShortRef, TTitle } from './derived'
import { TDocumentPresenter } from './presentation'
import { TSpace, TAccount, TPerson } from './security'
import { TTx, TTxCreateDoc, TTxRemoveDoc, TTxUpdateDoc } from './tx'

export * from './core'
export * from './security'
export * from './tx'
export * from './derived'
export * from './presentation'
export { core as default }

/**
 * @public
 */
export function createModel (builder: Builder): void {
  builder.createModel(
    TObj,
    TDoc,
    TClass,
    TMixin,
    TTx,
    TTxCreateDoc,
    TTxUpdateDoc,
    TTxRemoveDoc,
    TSpace,
    TPerson,
    TAccount,
    TDerivedData,
    TDerivedDataDescriptor,
    TTitle,
    TReference,
    TShortRef,
    TDocumentPresenter
  )
}
