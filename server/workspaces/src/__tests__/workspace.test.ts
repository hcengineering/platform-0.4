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

import { getMongoClient, shutdown } from '@anticrm/mongo'
import { createWorkspace, deleteWorkspace, upgradeWorkspace } from '..'
import { DOMAIN_TX } from '@anticrm/core'

describe('workspaces', () => {
  const mongoDBUri: string = process.env.MONGODB_URI ?? 'mongodb://localhost:27017'

  afterAll(async () => {
    await shutdown()
  })

  it('create & delete workspace', async () => {
    const client = await getMongoClient(mongoDBUri)
    await createWorkspace('my', { mongoDBUri })

    expect(
      await client
        .db('ws-my')
        .collection(DOMAIN_TX as string)
        .find({})
        .count()
    ).toBeGreaterThan(0)
    await deleteWorkspace('my', { mongoDBUri })

    const collections = await client.db('ws-my').collections()
    expect(collections.length).toEqual(0)
  })

  it('upgrade workspace', async () => {
    const client = await getMongoClient(mongoDBUri)
    await createWorkspace('my', { mongoDBUri })

    expect(
      await client
        .db('ws-my')
        .collection(DOMAIN_TX as string)
        .find({})
        .count()
    ).toBeGreaterThan(0)

    await upgradeWorkspace('my', { mongoDBUri })
    expect(
      await client
        .db('ws-my')
        .collection(DOMAIN_TX as string)
        .find({})
        .count()
    ).toBeGreaterThan(0)

    await deleteWorkspace('my', { mongoDBUri })

    const collections = await client.db('ws-my').collections()
    expect(collections.length).toEqual(0)
  })
  it('delete missing workspace', async () => {
    await deleteWorkspace('my-missing', { mongoDBUri })
  })
})
