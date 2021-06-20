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

import builder from '@anticrm/model-all'
import core, { Hierarchy, Tx } from '@anticrm/core'
import { generateToken } from '@anticrm/server/src/token'
import { MongoConnection } from '../../mongo/lib'

if (process.argv.length < 2) {
  console.warn('please use server-cli with {command} {arg} ')
}
const cmd = process.argv[2]
const arg1 = process.argv[3]
const arg2 = process.argv[4]

const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017'
const SECRET = process.env.SERVER_SECRET ?? 'mongodb://localhost:27017'

async function main (): Promise<void> {
  switch (cmd) {
    case 'generate-token': {
      const token = generateToken(SECRET, arg1, arg2)
      console.log('TOKEN: ', token)
      break
    }
    case 'create-workspace': {
      console.log('creating workspace: ', arg1)

      const mongoConnection = new MongoConnection(MONGO_URI)

      const hierarchy = new Hierarchy()
      const txes = builder.getTxes()
      for (const t of txes) {
        await hierarchy.tx(t)
      }

      const txStore = await mongoConnection.createMongoTxStorage(arg1, hierarchy)

      const wsTxes = await txStore.findAll<Tx>(core.class.Tx, { objectSpace: core.space.Model })
      if (wsTxes.length > 0) {
        console.warn('space is already created. Consider upgrade procedure.')
        return
      }

      // If no txes found, let's create all transactions.
      for (const tx of txes) {
        await txStore.tx(tx)
      }
      await mongoConnection.shutdown()
      break
    }
    default:
      console.error('Unknown command', process.argv)
  }
}

main().catch((err) => console.error(err))
