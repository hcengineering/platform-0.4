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

import * as gravatar from 'gravatar'
import core, { Account, newTxCreateDoc, Ref, Tx, CoreClient } from '@anticrm/core'

import { Server, start } from './server'
import { AccountDetails, decodeToken } from './token'
import { assignWorkspace, closeWorkspace, WorkspaceInfo } from './workspaces'
import { SecurityOptions } from './tls_utils'

/**
 * @public
 */
export interface ServerOptions {
  logTransactions: boolean
  logRequests: boolean
  security?: SecurityOptions
}

/**
 * @public
 */
export async function startServer (
  host: string | undefined,
  port: number,
  serverToken: string,
  options: ServerOptions
): Promise<Server> {
  const instance = await start(
    host,
    port,
    {
      connect: connectClient(serverToken, options),
      close: async (clientId) => {
        await closeWorkspace(clientId)
      }
    },
    options.security
  )
  return instance
}

function connectClient (
  serverToken: string,
  options: ServerOptions
): (clientId: string, token: string, sendTx: (tx: Tx) => void, close: () => void) => Promise<CoreClient> {
  return async (clientId, token, sendTx) => {
    try {
      const { accountId, workspaceId, details } = decodeToken(serverToken, token)
      console.log(`Connected Client ${clientId} with account: ${accountId} to ${workspaceId} `)

      // eslint-disable-next-line
      const { workspace, clientStorage } = await assignWorkspace({ clientId, accountId, workspaceId, tx: sendTx })

      // We need to check if there is Account exists and if not create it.
      await updateAccount(clientId, workspace, accountId, details)

      if (options.logTransactions || options.logRequests) {
        return withLogging(clientStorage, options, accountId, details)
      }

      return clientStorage
    } catch (err: any) {
      console.error('FAILED to accept client:', err)
      throw new Error('invalid token')
    }
  }
}

function withLogging (
  clientStorage: CoreClient,
  options: ServerOptions,
  accountId: Ref<Account>,
  details: AccountDetails
): CoreClient {
  return {
    findAll: async (_class, query) => {
      const resultTx = clientStorage.findAll(_class, query)
      resultTx.catch((err) => {
        if (options.logRequests) {
          console.info(
            `request from ${accountId}-${details?.email} find request: _class=${_class} query=${JSON.stringify(
              query,
              undefined,
              2
            )}`,
            err
          )
        }
      })
      const result = await resultTx
      if (options.logRequests) {
        let printResult: any = result
        if (Array.isArray(result)) {
          printResult = result.slice(0, 5)
        }
        console.info(
          `request from ${accountId}-${details?.email} find request: _class=${_class} query=${JSON.stringify(
            query,
            undefined,
            2
          )} result: ${JSON.stringify(printResult)}`
        )
      }
      return result
    },
    tx: async (tx) => {
      const resultTx = clientStorage.tx(tx)
      resultTx.catch((err) => {
        if (options.logTransactions) {
          console.info(`tx from ${accountId}-${details?.email} tx=${JSON.stringify(tx, undefined, 2)}`, err)
        }
      })
      const result = await resultTx
      if (options.logTransactions) {
        console.info(
          `tx from ${accountId}-${details?.email} tx=${JSON.stringify(tx, undefined, 2)} result: ${JSON.stringify(
            result
          )}`
        )
      }
      return result
    },
    accountId: async () => await clientStorage.accountId()
  }
}

/**
 * Will check and create Account for current log-in user if required.
 */
async function updateAccount (
  clientId: string,
  workspace: WorkspaceInfo,
  accountId: Ref<Account>,
  details: AccountDetails
): Promise<void> {
  const accountRef = await workspace.workspace.model.findAll(core.class.Account, { _id: accountId })
  if (accountRef.length === 0) {
    // We need to create an account entry.
    await workspace.workspace.tx(
      clientId,
      newTxCreateDoc<Account>(
        accountId,
        core.class.Account,
        core.space.Model,
        {
          email: details.email,
          name: ((details?.firstName ?? '') + ' ' + (details?.lastName ?? '')).trim(),
          firstName: details?.firstName ?? '',
          lastName: details?.lastName ?? '',
          avatar: gravatar.url(details.email) // TODO: Use platform plugin mechanism for this
        },
        accountId
      )
    )
  }
}
