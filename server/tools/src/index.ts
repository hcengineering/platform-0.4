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
import { generateToken } from '@anticrm/server/src/token'
import { Workspace, shutdown } from '@anticrm/workspace'

if (process.argv.length < 2) {
  console.warn('please use server-cli with {command} {arg} ')
}
const cmd = process.argv[2]
const arg1 = process.argv[3]
const arg2 = process.argv[4]

const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017'
const SECRET = process.env.SERVER_SECRET ?? 'mongodb://localhost:27017'

async function main (): Promise<void> {
  try {
    switch (cmd) {
      case 'generate-token': {
        const token = generateToken(SECRET, arg1, arg2)
        console.log('TOKEN: ', token)
        break
      }
      case 'create-workspace': {
        console.log(`creating workspace ${arg1} (with dropping all model transactions)`)
        const ws = await Workspace.create(arg1, { mongoDBUri: MONGO_URI })
        await ws.initialize(builder.getTxes())
        break
      }
      default:
        console.error('Unknown command', process.argv)
    }
  } finally {
    await shutdown()
  }
}

main().catch((err) => {
  console.error(err)
})
