//
// Copyright © 2020, 2021 Anticrm Platform Contributors.
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

import type { Class, Doc, Ref } from '@anticrm/core'
import type { Plugin, Service } from '@anticrm/platform'
import { plugin } from '@anticrm/platform'
import type { Resource } from '@anticrm/status'
import { Action as ActionDef } from '@anticrm/action'

export interface Action extends Doc {
  name: string
  description: string
  input?: Ref<Class<Doc>>
  resId: Resource<ActionDef>
}

export interface ExecutionContext extends Doc {
  stack: any[]
  counter: number[]
}

export enum ActionState {
  Pending = 'pending',
  Fullfilled = 'fullfilled',
  Rejected = 'rejected'
}

export interface ActionInstance extends Doc {
  action: Ref<Action>
  // String target is temporary solution, most likely
  // it will be removed from ActionInstance and become
  // part of inherited classes to fit plugin requirements.
  target: string
  input?: Ref<Doc>
  state: ActionState
  context: Ref<ExecutionContext>
  reject?: string
}

export interface ActionService extends Service {
  runAction: (action: Action, target: string, input?: Ref<Doc>) => Promise<void>
}

const PluginAction = 'action' as Plugin<ActionService>

export default plugin(PluginAction, {}, {
  class: {
    Action: '' as Ref<Class<Action>>,
    ActionInstance: '' as Ref<Class<ActionInstance>>,
    ExecutionContext: '' as Ref<Class<ExecutionContext>>
  }
})
