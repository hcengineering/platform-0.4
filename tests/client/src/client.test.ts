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

import { addLocation, getPlugin } from '@anticrm/platform'
import { getClient } from '@anticrm/client'

import pluginCore from '@anticrm/plugin-core'
import core from '@anticrm/core'

describe('client', () => {

  addLocation(pluginCore, () => import('@anticrm/plugin-core-dev'))

  it('should create connection', async () => {
    const coreService = await getPlugin(pluginCore.id)
    const conn = coreService.connect(() => {})
    const txes = await conn.findAll(core.class.Tx, {})
    console.log(txes)
    expect(true).toBeTruthy()
  })

  // it('should create client', async () => {
  //   const client = await getClient()
  //   const txes = client.findAll(core.class.Tx, {})
  //   console.log(txes)
  //   expect(true).toBeTruthy()
  // })

})