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

import { Class, Data, Doc, Ref, Tx } from '@anticrm/core'
import { createBuilder } from '@anticrm/model-all'
import { demoAccount } from './demoAccount'
import { demoChunter } from './demoChunter'
import { demoTask } from './demoTask'
import { demoRecruiting } from './demoRecruiting'
import { DemoBuilder } from './model'
export { DemoBuilder }
export { demoAccount, demoTask, demoChunter, demoRecruiting }

async function buildTxes (): Promise<Tx[]> {
  const builder = createBuilder()
  console.info('GENERATE DEMO DATA...')
  const db: DemoBuilder = {
    createDoc: async <T extends Doc>(
      _class: Ref<Class<T>>,
      attributes: Data<T>,
      objectId: Ref<T>, // ObjectID should be not uniq for model instance values, for upgrade procedure to work properly.
      docOptions?: Partial<Doc>
    ): Promise<T> => {
      return builder.createDoc(_class, attributes, objectId, docOptions)
    }
  }
  await demoAccount(db)
  const tasks = await demoTask(db)
  await demoChunter(db, tasks)
  await demoRecruiting(db)
  return builder.getTxes()
}

/**
 * @public
 */
const txes = buildTxes()
/**
 * @public
 */
export default txes
