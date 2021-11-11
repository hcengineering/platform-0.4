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

import { plugin } from '@anticrm/platform'
import type { Plugin, Service } from '@anticrm/platform'
import type { Doc, Ref, Class, Space, Data } from '@anticrm/core'
import type { Action } from '@anticrm/action-plugin'

export interface FSM extends Doc {
  name: string
  clazz: Ref<Class<Doc>>
  isTemplate: boolean
}

export interface Transition extends Doc {
  from: Ref<State>
  to: Ref<State>
  fsm: Ref<FSM>
}

export interface FSMItem extends Doc {
  fsm: Ref<FSM>
  state: Ref<State>
  item: Ref<Doc>
  clazz: Ref<Class<Doc>>
  rank: string
}

export interface State extends Doc {
  name: string
  color: string
  fsm: Ref<FSM>
  requiredActions: Array<Ref<Action>>
  optionalActions: Array<Ref<Action>>
  rank: string
}

export interface FSMService extends Service {
  getStates: (fsm: Ref<FSM>) => Promise<State[]>
  getTransitions: (fsm: Ref<FSM>) => Promise<Transition[]>

  addItem: <T extends FSMItem>(fsm: Ref<FSM>, item: {
    _class?: Ref<Class<T>>
    obj: Omit<T, keyof Doc | 'state' | 'fsm' | 'rank'> & {state?: Ref<State>}
  }) => Promise<FSMItem | undefined>
  moveItem: (
    item: FSMItem,
    state: Ref<State>,
    place: {
      prev?: FSMItem
      next?: FSMItem
    }
  ) => Promise<void>

  addState: (
    state: Omit<Data<State>, 'rank'>
  ) => Promise<State>
  moveState: (
    state: State,
    place: { prev?: State, next?: State }
  ) => Promise<void>
  removeState: (
    state: State
  ) => Promise<void>
}

const PluginMeeting = 'fsm' as Plugin<FSMService>

export default plugin(PluginMeeting, {}, {
  class: {
    FSM: '' as Ref<Class<FSM>>,
    FSMItem: '' as Ref<Class<FSMItem>>,
    Transition: '' as Ref<Class<Transition>>,
    State: '' as Ref<Class<State>>
  }
})
