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

import { connect } from '../connection'
import core, { createClient } from '@anticrm/core'
import builder from '@anticrm/model-dev'

describe('client', () => {
  it('should create connection', async () => {
    const conn = await connect(() => {})
    const txes = builder.getTxes()
    const result = await conn.findAll(core.class.Tx, {})
    expect(result).toHaveLength(txes.length)
  })

  it('should create client', async () => {
    const client = await createClient(connect)
    const txes = builder.getTxes()
    const result = await client.findAll(core.class.Class, {})
    const expectedLength = txes.filter((tx) => client.isDerived((tx as any).objectClass, core.class.Class)).length
    expect(result).toHaveLength(expectedLength)
  })
})
