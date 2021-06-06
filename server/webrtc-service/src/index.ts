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

import { start } from './server'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
start('localhost', 18081)
  .then(proto => {
    console.log('Server has been started')

    process.once('SIGINT', () => {
      proto.shutdown()
      process.exit(0)
    })
    process.once('SIGTERM', () => {
      proto.shutdown()
      process.exit(0)
    })
    process.on('uncaughtException', (err) => {
      console.error(err)
    })
    process.on('exit', () => {
      console.log('Server has stopped')
    })
  })
