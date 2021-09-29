//
// Copyright © 2020 Anticrm Platform Contributors.
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
import type { Metadata, Service, Plugin } from '@anticrm/platform'
import type { Account, Class, Obj, Ref, Storage, TxOperations } from '@anticrm/core'
import type { Queriable } from '@anticrm/query'

export interface Client extends Storage, TxOperations, Queriable {
  isDerived: <T extends Obj>(_class: Ref<Class<T>>, from: Ref<Class<T>>) => boolean
}

export interface CoreService extends Service {
  /**
   * Return a working connection, make one if not pressent.
   */
  getClient: () => Promise<Client>

  /**
   * Discard current active connection.
   */
  disconnect: () => Promise<void>
}

const PluginCore = 'plugin-core' as Plugin<CoreService>

export default plugin(
  PluginCore,
  {},
  {
    metadata: {
      ClientUrl: '' as Metadata<string>, // A URI to connect to server.
      Token: '' as Metadata<string>, // An a token to use for client connection.
      AccountId: '' as Metadata<Ref<Account>>
    }
  }
)
