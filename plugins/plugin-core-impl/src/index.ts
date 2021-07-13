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

import { createClient, withOperations } from '@anticrm/core'
import { getMetadata } from '@anticrm/platform'
import pluginCore, { Client, CoreService } from '@anticrm/plugin-core'
import { LiveQuery } from '@anticrm/query'
import { connect as connectBrowser } from './connection'

export default async (): Promise<CoreService> => {
  let client: Client | undefined

  async function getClient (): Promise<Client> {
    if (client === undefined) {
      const clientUrl = getMetadata(pluginCore.metadata.ClientUrl) ?? 'localhost:18080'
      const storage = await createClient(async (tx) => {
        return await connectBrowser(clientUrl, tx)
      })

      const accountId = await storage.accountId()
      client = withOperations(accountId, new LiveQuery(storage))
    }
    return client
  }

  return {
    getClient
  }
}
