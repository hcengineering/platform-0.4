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
import type { FSM, Transition, WithFSM, FSMItem, State } from '@anticrm/fsm'
import fsm from '@anticrm/fsm-impl/src/plugin'

import core, { TDoc } from '@anticrm/model-core'
import type { Class, Doc, Ref } from '@anticrm/core'
import type { Application } from '@anticrm/workbench'

@Model(fsm.class.FSM, core.class.Doc)
class TFSM extends TDoc implements FSM {
  name!: string
  application!: Ref<Application>
  isTemplate!: boolean
}

@Model(fsm.class.FSMItem, core.class.Doc)
class TFSMItem extends TDoc implements FSMItem {
  fsm!: Ref<WithFSM>
  state!: Ref<State>
  item!: Ref<Doc>
  clazz!: Ref<Class<Doc>>
}

@Model(fsm.class.State, core.class.Doc)
class TState extends TDoc implements State {
  name!: string
  fsm!: Ref<FSM>
}

@Model(fsm.class.Transition, core.class.Doc)
class TTransition extends TDoc implements Transition {
  from!: Ref<State>
  to!: Ref<State>
  fsm!: Ref<FSM>
}

@Model(fsm.class.WithFSM, core.class.Doc)
class TWithFSM extends TDoc implements WithFSM {
  fsm!: Ref<FSM>
}

export function createModel (builder: Builder): void {
  builder.createModel(
    TFSM,
    TState,
    TTransition,
    TFSMItem,
    TWithFSM
  )
}
