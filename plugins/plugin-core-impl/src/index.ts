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

import { createClient, TxHandler, WithFiles, withOperations } from '@anticrm/core'
import { getMetadata } from '@anticrm/platform'
import pluginCore, { Client, CoreService } from '@anticrm/plugin-core'
import { LiveQuery } from '@anticrm/query'
import { connect as connectBrowser } from './connection'

let client: Client | undefined
let clientClose: (() => void) | undefined
let liveQuery: LiveQuery | undefined

async function doConnect (tx: TxHandler): Promise<WithFiles> {
  const clientUrl = getMetadata(pluginCore.metadata.ClientUrl) ?? 'localhost:18080'
  const { storage, close } = await connectBrowser(clientUrl, tx)
  clientClose = close
  return storage
}

async function getClient (): Promise<Client> {
  if (client === undefined) {
    const storage = await createClient(doConnect, (tx) => {
      liveQuery?.notifyTx(tx).catch((err) => console.error(err))
    })

    const accountId = await storage.accountId()

    liveQuery = new LiveQuery(storage)
    client = withOperations(accountId, liveQuery)
  }
  return client
}
async function disconnect (): Promise<void> {
  clientClose?.()
  client = undefined
}

export default async (): Promise<CoreService> => {
  return {
    getClient,
    disconnect
  }
}
