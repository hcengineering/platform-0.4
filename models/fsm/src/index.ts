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

import type { Class, Doc, Domain, Ref } from '@anticrm/core'
import type { FSM, FSMItem, State, Transition } from '@anticrm/fsm'
import fsmPlugin from '@anticrm/fsm'
import { Builder, Model } from '@anticrm/model'
import core, { TDoc } from '@anticrm/model-core'
import type { Action } from '@anticrm/action-plugin'

const DOMAIN_FSM = 'fsm' as Domain

/**
 * @public
 */
@Model(fsmPlugin.class.FSM, core.class.Doc, DOMAIN_FSM)
export class TFSM extends TDoc implements FSM {
  name!: string
  clazz!: Ref<Class<Doc>>
  isTemplate!: boolean
}

/**
 * @public
 */
@Model(fsmPlugin.class.FSMItem, core.class.Doc, DOMAIN_FSM)
export class TFSMItem extends TDoc implements FSMItem {
  fsm!: Ref<FSM>
  state!: Ref<State>
  item!: Ref<Doc>
  clazz!: Ref<Class<Doc>>
  rank!: string
}

/**
 * @public
 */
@Model(fsmPlugin.class.State, core.class.Doc, DOMAIN_FSM)
export class TState extends TDoc implements State {
  name!: string
  color!: string
  fsm!: Ref<FSM>
  optionalActions!: Ref<Action>[]
  requiredActions!: Ref<Action>[]
  rank!: string
}

/**
 * @public
 */
@Model(fsmPlugin.class.Transition, core.class.Doc, DOMAIN_FSM)
export class TTransition extends TDoc implements Transition {
  from!: Ref<State>
  to!: Ref<State>
  fsm!: Ref<FSM>
}

/**
 * @public
 */
export function createModel (builder: Builder): void {
  builder.createModel(TFSM, TState, TTransition, TFSMItem)
}
