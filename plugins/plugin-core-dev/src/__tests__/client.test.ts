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

import core, { Doc, newTxCreateDoc, TxCreateDoc, TxProcessor } from '@anticrm/core'
import builder from '@anticrm/model-dev'
import { ClientImpl } from '../connection'

import service from '../'

describe('client', () => {
  it('should create connection', async () => {
    const conn = await ClientImpl.create()
    const txes = builder.getTxes()
    const result = await conn.findAll(core.class.Tx, {})
    expect(result.length).toEqual(txes.length)
  })

  it('should create client', async () => {
    const client = await ClientImpl.create()
    const txes = builder.getTxes()
    const result = await client.findAll(core.class.Class, {})
    const expected = txes
      .filter(
        (tx) => tx._class === core.class.TxCreateDoc && client.isDerived((tx as any).objectClass, core.class.Class)
      )
      .map((t) => TxProcessor.createDoc2Doc(t as TxCreateDoc<Doc>))
    expect(result.length).toEqual(expected.length)
  })

  it('should create connection', async () => {
    const s = await service()
    const client = await s.getClient()
    expect(client.accountId()).toEqual(core.account.System)
    await client.tx(
      newTxCreateDoc(core.account.System, core.class.Account, core.space.Model, {
        email: 'vasya',
        name: 'vasya'
      })
    )
    await s.disconnect()
  })
})
