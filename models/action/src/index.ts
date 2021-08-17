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

import { Builder, Model } from '@anticrm/model'
import core, { TDoc } from '@anticrm/model-core'
import { Class, Doc, DOMAIN_MODEL, Ref } from '@anticrm/core'
import { Resource } from '@anticrm/status'
import type { Action as ActionDef } from '@anticrm/action'
import action, { ActionInstance, ActionState, ExecutionContext } from '@anticrm/action-plugin'
import type { Action } from '@anticrm/action-plugin'

/**
 * @public
 */
@Model(action.class.Action, core.class.Doc, DOMAIN_MODEL)
class TAction extends TDoc implements Action {
  name!: string
  description!: string
  input!: Ref<Class<Doc>>
  resId!: Resource<ActionDef>
}

/**
 * @public
 */
@Model(action.class.ActionInstance, core.class.Doc, DOMAIN_MODEL)
class TActionInstance extends TDoc implements ActionInstance {
  action!: Ref<Action>
  target!: Ref<Doc>
  input!: Ref<Doc>
  state!: ActionState
  context!: Ref<ExecutionContext>
  reject!: string
}

/**
 * @public
 */
@Model(action.class.ExecutionContext, core.class.Doc, DOMAIN_MODEL)
class TExecutionContext extends TDoc implements ExecutionContext {
  stack!: any[]
  counter!: number[]
}

/**
 * @public
 */
export function createModel (builder: Builder): void {
  builder.createModel(TAction, TActionInstance, TExecutionContext)
}
