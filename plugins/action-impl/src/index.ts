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

import type { Doc, Ref } from '@anticrm/core'
import core from '@anticrm/core'
import { getPlugin } from '@anticrm/platform'
import corePlugin, { Client } from '@anticrm/plugin-core'
import type { Action, ActionService } from '@anticrm/action-plugin'
import actionP, { ActionState } from '@anticrm/action-plugin'

export default async (): Promise<ActionService> => {
  const coreP = await getPlugin(corePlugin.id)
  const client: Client = await coreP.getClient()

  return {
    runAction: async (action: Action, target: Ref<Doc>, input?: Ref<Doc>): Promise<void> => {
      const context = await client.createDoc(
        actionP.class.ExecutionContext,
        core.space.Model,
        {
          counter: [0],
          stack: []
        }
      )

      await client.createDoc(
        actionP.class.ActionInstance,
        core.space.Model,
        {
          action: action._id,
          target,
          context: context._id,
          state: ActionState.Pending,
          input
        }
      )
    }
  }
}
