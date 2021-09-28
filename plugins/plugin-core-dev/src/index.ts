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

import type { TxOperations } from '@anticrm/core'
import core, { createClient, withOperations } from '@anticrm/core'
import type { Client, CoreService } from '@anticrm/plugin-core'
import { LiveQuery } from '@anticrm/query'
import { ClientImpl } from './connection'
import regCalendarMappers from '@anticrm/calendar-mappers'
import regNotificationMappers from '@anticrm/notification-mappers'

/*!
 * Anticrm Platform™ Workbench Plugin
 * © 2020 Anticrm Platform Contributors. All Rights Reserved.
 * Licensed under the Eclipse Public License, Version 2.0
 */
export default async (): Promise<CoreService> => {
  let client: Client | undefined

  async function getClient (): Promise<Client & TxOperations> {
    if (client === undefined) {
      // eslint-disable-next-line prefer-const
      let liveQuery: LiveQuery | undefined

      const clientImpl = await ClientImpl.create()

      const storage = await createClient(
        async (handler) => {
          clientImpl.handler = handler
          return clientImpl
        },
        (tx) => {
          void clientImpl.model.tx(tx) // eslint-disable-line no-void
          liveQuery?.notifyTx(tx).catch((err) => console.error(err))
        }
      )
      liveQuery = new LiveQuery(storage)

      client = withOperations(core.account.System, liveQuery)
      regCalendarMappers()
      regNotificationMappers()
    }
    return client
  }

  return {
    getClient,
    disconnect: async () => await Promise.resolve()
  }
}
