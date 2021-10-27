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
import { PlatformConfiguration } from './config'
import attachment from '@anticrm/attachment'

async function loadConfiguration (): Promise<PlatformConfiguration> {
  return await new Promise<PlatformConfiguration>((resolve) => {
    const xmlHttp = new XMLHttpRequest()
    xmlHttp.onreadystatechange = function () {
      if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
        const config = JSON.parse(xmlHttp.responseText) as PlatformConfiguration
        resolve(config)
      }
    }
    xmlHttp.open('GET', '/env.json', true)
    xmlHttp.send(null)
  })
}

async function init (): Promise<void> {
  const config = await loadConfiguration()
  configurePlatform(config)
  setMetadata(login.metadata.AccountsUrl, config.accountsUri)
  setMetadata(meetingPlugin.metadata.ClientUrl, config.meetingsUri)
  setMetadata(pluginCore.metadata.ClientUrl, config.clientUri)
  setMetadata(attachment.metadata.FilesUrl, config.fileServerUri)

  addEventListener('Token', async (event, data) => {
    setMetadata(pluginCore.metadata.Token, data)
    setMetadata(meetingPlugin.metadata.Token, data)
    const attachmentPlugin = await getPlugin(attachment.id)
    await attachmentPlugin.authorize(data)
  })

  const loginInfo = currentAccount()
  if (loginInfo !== undefined) {
    void broadcastEvent('Token', loginInfo.token)
  }

  createApp(document.body)
}
void init()
