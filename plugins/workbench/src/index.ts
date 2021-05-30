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

import { getContext } from 'svelte'

import type { IntlString, Asset } from '@anticrm/status'
import type { Ref, Class } from '@anticrm/core'
import type { Service, Plugin } from '@anticrm/platform'
import type { Doc } from '@anticrm/core'
import type { Client } from '@anticrm/plugin-core'

import { plugin } from '@anticrm/platform'

export interface Application extends Doc {
  label: IntlString
  icon: Asset
}

export interface WorkbenchService extends Service {

}

const PluginWorkbench = 'workbench' as Plugin<WorkbenchService>

const workbench = plugin(PluginWorkbench, {}, {
  context: {
    Client: ''
  },
  class: {
    Application: '' as Ref<Class<Application>>
  }
})

export function getClient(): Client {
  return getContext<Client>(workbench.context.Client)
}

export default workbench