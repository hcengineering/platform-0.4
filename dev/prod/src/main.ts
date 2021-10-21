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

import { addEventListener, broadcastEvent, getPlugin, setMetadata } from '@anticrm/platform'
import { createApp } from '@anticrm/ui'
import login, { currentAccount } from '@anticrm/login'
import pluginCore from '@anticrm/plugin-core'
import meetingPlugin from '@anticrm/meeting'

import { configurePlatform } from './platform'
import attachment from '@anticrm/attachment'

configurePlatform()

const accountsUrl = process.env.APP_ACCOUNTS_URL
const meetingHost = process.env.MEETING_WSHOST ?? 'localhost'
const meetingPort = process.env.MEETING_WSPORT ?? 18081
const fileServerUrl =
  process.env.APP_FILES_URL ?? (process.env.CLIENT !== 'server' ? 'blob:' : 'https://localhost:18082')
const clientUri = process.env.CLIENT_URL ?? 'wss://localhost:18080'

setMetadata(login.metadata.AccountsUrl, accountsUrl)
setMetadata(attachment.metadata.FilesUrl, fileServerUrl)
setMetadata(meetingPlugin.metadata.ClientUrl, `${meetingHost}:${meetingPort}`)
setMetadata(pluginCore.metadata.ClientUrl, clientUri)

addEventListener('Token', async (event, data) => {
  setMetadata(pluginCore.metadata.Token, data)
  const attachmentPlugin = await getPlugin(attachment.id)
  await attachmentPlugin.authorize(data)
})

const loginInfo = currentAccount()
if (loginInfo !== undefined) {
  void broadcastEvent('Token', loginInfo.token)
}

createApp(document.body)
