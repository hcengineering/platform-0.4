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

import regCalendarMappers from '@anticrm/calendar-mappers'
import type { TxOperations } from '@anticrm/core'
import core, { createClient, withOperations } from '@anticrm/core'
import { NotificationHandler } from '@anticrm/notification'
import regNotificationMappers from '@anticrm/notification-mappers'
import type { Client, CoreService } from '@anticrm/plugin-core'
import { LiveQuery } from '@anticrm/query'
import regRecruitingMappers from '@anticrm/recruiting-mappers'
import { ClientImpl } from './connection'
import txesPromise from '@anticrm/model-dev'

/*!
 * Anticrm Platform™ Workbench Plugin
 * © 2020 Anticrm Platform Contributors. All Rights Reserved.
 * Licensed under the Eclipse Public License, Version 2.0
 */
export default async (): Promise<CoreService> => {
  let client: (Client & TxOperations) | undefined
  let close: () => Promise<void> = async () => await Promise.resolve()

  async function getClient (): Promise<Client & TxOperations> {
    if (client === undefined) {
      // eslint-disable-next-line prefer-const
      let liveQuery: LiveQuery | undefined

      // eslint-disable-next-line prefer-const
      let notificationHandler: NotificationHandler | undefined

      await regCalendarMappers()
      await regNotificationMappers()
      await regRecruitingMappers()

      const clientImpl = await ClientImpl.create(await txesPromise, typeof window !== 'undefined')

      const storage = await createClient(
        async (handler) => {
          clientImpl.handler = handler
          return clientImpl
        },
        (tx) => {
          liveQuery?.notifyTx(tx).catch((err) => console.error(err))
          notificationHandler?.tx(tx)
        }
      )
      close = async () => await storage.close()
      liveQuery = new LiveQuery(storage)

      client = withOperations(core.account.System, liveQuery)
      notificationHandler = NotificationHandler.get(client)
    }
    return client
  }

  return {
    getClient,
    disconnect: async () => await close()
  }
}
