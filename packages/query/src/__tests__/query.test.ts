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

import type { Doc, Space, TxCreateDoc, TxOperations } from '@anticrm/core'
import core, { createClient, SortingOrder, Storage, withOperations, _genMinModel as getModel } from '@anticrm/core'
import { LiveQuery } from '..'
import { connect } from './connection'
export interface Client extends Storage, TxOperations, LiveQuery {}

interface Channel extends Space {
  x: number
}
describe('query', () => {
  it('findAll', async () => {
    const storage = await getClient()
    const result = await storage.findAll<Space>(core.class.Space, {})
    expect(result).toHaveLength(2)
  })

  it('query with param', async (done) => {
    const storage = await getClient()

    let expectedLength = 0
    const txes = getModel()
    for (let i = 0; i < txes.length; i++) {
      if (storage.isDerived((txes[i] as TxCreateDoc<Doc>).objectClass, core.class.Space)) {
        expectedLength++
      }
    }

    storage.query<Space>(core.class.Space, { private: false }, (result) => {
      expect(result).toHaveLength(expectedLength)
      done()
    })
  })

  it('query should be live', async (done) => {
    const storage = await getClient()

    let expectedLength = 0
    const txes = getModel()
    for (let i = 0; i < txes.length; i++) {
      if (storage.isDerived((txes[i] as TxCreateDoc<Doc>).objectClass, core.class.Space)) {
        expectedLength++
      }
    }

    let attempt = 0
    storage.query<Space>(core.class.Space, { private: false }, (result) => {
      expect(result).toHaveLength(expectedLength + attempt)
      if (attempt > 0) {
        expect((result[expectedLength + attempt - 1] as any).x).toBe(attempt)
      }
      if (attempt++ === 3) {
        // check underlying storage received all data.
        storage
          .findAll<Space>(core.class.Space, { private: false })
          .then((result) => {
            expect(result).toHaveLength(expectedLength + attempt - 1)
            done()
          })
          .catch((err) => expect(err).toBeUndefined())
      }
    })


    await storage.createDoc(core.class.Account, core.space.Model, {
      email: 'user1@site.com',
      name: 'User1'
    })
    await storage.createDoc<Channel>(core.class.Space, core.space.Model, {
      private: true,
      name: '#0',
      description: '',
      members: [],
      x: 0
    })
    await storage.createDoc<Channel>(core.class.Space, core.space.Model, {
      private: false,
      name: '#1',
      description: '',
      members: [],
      x: 1
    })
    await storage.createDoc<Channel>(core.class.Space, core.space.Model, {
      private: false,
      name: '#2',
      description: '',
      members: [],
      x: 2
    })
    await storage.createDoc<Channel>(core.class.Space, core.space.Model, {
      private: false,
      name: '#3',
      description: '',
      members: [],
      x: 3
    })
  })

  it('unsubscribe query', async () => {
    const storage = await getClient()

    let expectedLength = 0
    const txes = getModel()
    for (let i = 0; i < txes.length; i++) {
      if (storage.isDerived((txes[i] as TxCreateDoc<Doc>).objectClass, core.class.Space)) {
        expectedLength++
      }
    }

    const unsubscribe = storage.query<Space>(core.class.Space, { private: false }, (result) => {
      expect(result).toHaveLength(expectedLength)
    })

    unsubscribe()

    await storage.createDoc(core.class.Space, core.space.Model, {
      private: false,
      name: '#1',
      description: '',
      members: []
    })
    await storage.createDoc(core.class.Space, core.space.Model, {
      private: false,
      name: '#2',
      description: '',
      members: []
    })
    await storage.createDoc(core.class.Space, core.space.Model, {
      private: false,
      name: '#3',
      description: '',
      members: []
    })
  })

  it('query against core client', async (done) => {
    const client = await getClient()

    const expectedLength = 2
    let attempt = 0
    client.query<Space>(core.class.Space, { private: false }, (result) => {
      expect(result).toHaveLength(expectedLength + attempt)
      if (attempt > 0) {
        expect((result[expectedLength + attempt - 1] as any).x).toBe(attempt)
      }
      if (attempt++ === 1) done()
    })

    await client.createDoc<Channel>(core.class.Space, core.space.Model, {
      x: 1,
      private: false,
      name: '#1',
      description: '',
      members: []
    })
    await client.createDoc<Channel>(core.class.Space, core.space.Model, {
      x: 2,
      private: false,
      name: '#2',
      description: '',
      members: []
    })
    await client.createDoc<Channel>(core.class.Space, core.space.Model, {
      x: 3,
      private: false,
      name: '#3',
      description: '',
      members: []
    })
  })

  it('limit and sorting', async (done) => {
    const storage = await getClient()

    const limit = 1
    let attempt = -1
    let doneCount = 0

    storage.query<Space>(
      core.class.Space,
      { private: true },
      (result) => {
        if (attempt === 0 && result.length > 0) {
          expect(result.length).toEqual(limit)
          expect(result[0].name).toMatch('0')
        }
        if (attempt === 0) doneCount++
        if (doneCount === 2) done()
      },
      { limit: limit, sort: { name: SortingOrder.Ascending } }
    )

    storage.query<Space>(
      core.class.Space,
      { private: true },
      (result) => {
        if (attempt > 0 && result.length > 0) {
          expect(result.length).toEqual(limit)
          expect(result[0].name).toMatch(attempt.toString())
        }
        if (attempt === 9) doneCount++
        if (doneCount === 2) done()
      },
      { limit: limit, sort: { name: SortingOrder.Descending } }
    )

    for (let i = 0; i < 10; i++) {
      attempt = i
      await storage.createDoc(core.class.Space, core.space.Model, {
        private: true,
        name: i.toString(),
        description: '',
        members: []
      })
    }
  })

  it('remove', async (done) => {
    const client = await getClient()

    const expectedLength = 2
    let attempt = 0
    client.query<Space>(core.class.Space, { private: false }, (result) => {
      expect(result).toHaveLength(expectedLength - attempt)
      if (attempt++ === expectedLength) done()
    })

    const spaces = await client.findAll(core.class.Space, {})
    for (const space of spaces) {
      await client.removeDoc(space._class, space.space, space._id)
    }
  })

  it('remove with limit', async (done) => {
    const client = await getClient()

    const expectedLength = 2
    let attempt = 0
    client.query<Space>(core.class.Space, { private: false }, (result) => {
      expect(result).toHaveLength(attempt++ === expectedLength ? 0 : 1)
      if (attempt === expectedLength) done()
    }, { limit: 1 })

    const spaces = await client.findAll(core.class.Space, {})
    for (const space of spaces) {
      await client.removeDoc(space._class, space.space, space._id)
    }
  })

  it('update', async (done) => {
    const client = await getClient()

    const spaces = await client.findAll(core.class.Space, {})
    let attempt = 0
    client.query<Space>(
      core.class.Space,
      { private: false },
      (result) => {
        if (attempt > 0) {
          expect(result[attempt - 1].name === attempt.toString())
          expect(result[attempt - 1].members.length === 1)
          if (attempt === spaces.length) done()
        }
      },
      { sort: { private: SortingOrder.Ascending } }
    )

    for (const space of spaces) {
      attempt++
      await client.updateDoc(space._class, space.space, space._id, {
        name: attempt.toString(),
        $push: { members: core.account.System }
      })
    }
  })

  it('update-inner-field', async () => {
    const client = await getClient()

    const spaces = await client.findAll(core.class.Space, {})
    let queryResult: Doc[] = []
    await new Promise((resolve) => {
      client.query<Space>(core.class.Space, { 'account.starred': true }, (result) => {
        queryResult = result
        resolve(null)
      })
    })

    expect(queryResult.length).toEqual(0)

    await client.updateDoc(spaces[1]._class, spaces[1].space, spaces[1]._id, {
      account: { starred: false }
    })
    await client.updateDoc(spaces[0]._class, spaces[0].space, spaces[0]._id, {
      account: { starred: true }
    })

    expect(queryResult.length).toEqual(1)
  })

  it('update with no match query', async (done) => {
    const client = await getClient()

    const spaces = await client.findAll(core.class.Space, {})
    let attempt = 0
    client.query<Space>(
      core.class.Space,
      { private: false },
      (result) => {
        if (attempt > 0) {
          expect(result.length === spaces.length - attempt)
          expect(result.total === spaces.length - attempt)
          if (attempt === spaces.length) done()
        }
      },
      { sort: { private: SortingOrder.Ascending } }
    )

    for (const space of spaces) {
      attempt++
      await client.updateDoc(space._class, space.space, space._id, {
        private: true
      })
    }
  })

  it('update with over limit', async (done) => {
    const client = await getClient()

    const spaces = await client.findAll(core.class.Space, {})
    let attempt = 0
    client.query<Space>(
      core.class.Space,
      {},
      (result) => {
        expect(result[0].name).toEqual(`Sp${++attempt}`)
        if (attempt === spaces.length + 1) done()
      },
      { sort: { name: SortingOrder.Ascending }, limit: 1 }
    )

    for (let index = 0; index < spaces.length; index++) {
      const space = spaces[index]
      await client.updateDoc(space._class, space.space, space._id, {
        name: `Sp${index + spaces.length + 1}`
      })
    }
  })
})

async function getClient (): Promise<Client & TxOperations> {
  // eslint-disable-next-line prefer-const
  let liveQuery: LiveQuery | undefined

  const storage = await createClient(connect, (tx) => {
    liveQuery?.notifyTx(tx).catch((err) => console.error(err))
  })
  liveQuery = new LiveQuery(storage)

  return withOperations(core.account.System, liveQuery)
}
